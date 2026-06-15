import type { MissionKey } from "./missions";
import type { NormalizedProduct, ProductDetail, NutritionRow } from "./types";

// Open Food Facts client. Server-only: OFF requires a descriptive User-Agent on
// every request, and browsers forbid setting that header — so all OFF traffic is
// proxied through our route handlers, which also centralizes caching/rate-limit
// friendliness (15 product / 10 search requests per minute per IP).
//
// Product lookup uses the v3.6 API, whose nutrition lives in a NEW nested schema
// (product.nutrition.aggregated_set.nutrients.<name>.value) and whose eco score
// moved under environmental_score_data. The CGI search endpoints still return the
// older FLAT nutriments shape, so normalize() handles BOTH (see extractValues).

const OFF_BASE = "https://world.openfoodfacts.org";
const USER_AGENT = "SwapThis/1.0 (savion@stillinframe.com) - 100DayAIChallenge day-14";

// Flat-shape fields for the CGI search endpoints (v2-style nutriments_100g).
const FIELDS = [
  "code",
  "product_name",
  "brands",
  "image_front_small_url",
  "image_small_url",
  "nutriments",
  "nova_group",
  "nutriscore_grade",
  "ecoscore_score",
  "categories_tags",
  "unique_scans_n",
].join(",");

// v3.6 product-lookup fields (nutrition is nested; eco is environmental_score_*).
const V3_FIELD_LIST = [
  "code",
  "product_name",
  "brands",
  "image_front_small_url",
  "image_small_url",
  "nutrition",
  "nova_group",
  "nutriscore_grade",
  "environmental_score_grade",
  "environmental_score_data",
  "categories_tags",
  "unique_scans_n",
];
const V3_FIELDS = V3_FIELD_LIST.join(",");

// Extra fields only the rich detail page needs.
const DETAIL_FIELDS = [
  ...V3_FIELD_LIST,
  "ingredients_text",
  "allergens_tags",
  "additives_tags",
  "labels_tags",
  "quantity",
  "serving_size",
  "image_front_url",
  "image_url",
  "countries_tags",
].join(",");

interface OffNutrient {
  value?: number | string;
  unit?: string;
}

interface OffRawProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_small_url?: string;
  image_small_url?: string;
  // Flat shape (CGI search).
  nutriments?: Record<string, number | string | undefined>;
  // Nested shape (v3.6 product lookup).
  nutrition?: { aggregated_set?: { nutrients?: Record<string, OffNutrient> } };
  nova_group?: number | string;
  nutriscore_grade?: string;
  ecoscore_score?: number | string;
  environmental_score_grade?: string;
  environmental_score_data?: {
    agribalyse?: { score?: number | string };
    scores?: Record<string, number | string>;
  };
  categories_tags?: string[];
  unique_scans_n?: number;
  // detail-only fields
  ingredients_text?: string;
  allergens_tags?: string[];
  additives_tags?: string[];
  labels_tags?: string[];
  countries_tags?: string[];
  quantity?: string;
  serving_size?: string;
  image_front_url?: string;
  image_url?: string;
}

async function offFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${OFF_BASE}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      // Cache OFF responses for an hour — product data is effectively static and
      // this keeps us comfortably under the per-IP rate limits.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function num(value: number | string | undefined | null): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// Eco score: v3.6 buries it under environmental_score_data; fall back to the flat
// ecoscore_score (CGI search). Sparse either way — most products have none.
function ecoValue(raw: OffRawProduct): number | null {
  const esd = raw.environmental_score_data;
  const agri = num(esd?.agribalyse?.score);
  if (agri != null) return agri;
  for (const v of Object.values(esd?.scores ?? {})) {
    const n = num(v);
    if (n != null) return n;
  }
  return num(raw.ecoscore_score);
}

// Pull per-100g mission values from EITHER the v3.6 nested nutrition schema or
// the flat CGI-search shape, whichever the response carries.
function extractValues(raw: OffRawProduct): Record<MissionKey, number | null> {
  const nutrients = raw.nutrition?.aggregated_set?.nutrients;
  if (nutrients && Object.keys(nutrients).length > 0) {
    const nv = (k: string) => num(nutrients[k]?.value);
    return {
      calories: nv("energy-kcal"),
      sugar: nv("sugars"),
      salt: nv("salt"),
      protein: nv("proteins"),
      nova: num(raw.nova_group) ?? nv("nova-group"),
      eco: ecoValue(raw),
    };
  }
  const n = raw.nutriments ?? {};
  return {
    calories: num(n["energy-kcal_100g"]),
    sugar: num(n["sugars_100g"]),
    salt: num(n["salt_100g"]),
    protein: num(n["proteins_100g"]),
    nova: num(raw.nova_group),
    eco: ecoValue(raw),
  };
}

function normalize(raw: OffRawProduct): NormalizedProduct | null {
  const barcode = raw.code?.trim();
  const name = raw.product_name?.trim();
  if (!barcode || !name) return null;

  const brand = raw.brands?.split(",")[0]?.trim() || null;

  return {
    barcode,
    name,
    brand,
    image: raw.image_front_small_url || raw.image_small_url || null,
    nutriscore: raw.nutriscore_grade?.toLowerCase() || null,
    popularity: raw.unique_scans_n ?? 0,
    categoriesTags: raw.categories_tags ?? [],
    values: extractValues(raw),
  };
}

// Free-text product search (the "find what you're eating now" picker). Uses
// OFF's legacy CGI search, which is the reliable full-text endpoint. Requires an
// image so the picker looks clean.
export async function searchByName(query: string, country = ""): Promise<NormalizedProduct[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    fields: FIELDS,
    sort_by: "unique_scans_n",
    page_size: "24",
  });
  applyCountry(params, country, 0);
  const data = await offFetch<{ products?: OffRawProduct[] }>(`/cgi/search.pl?${params}`);
  if (!data?.products) return [];
  return data.products
    .map(normalize)
    .filter((p): p is NormalizedProduct => p !== null && p.image !== null);
}

export async function fetchProduct(barcode: string): Promise<NormalizedProduct | null> {
  const clean = barcode.replace(/\D/g, "");
  if (!clean) return null;
  const data = await offFetch<{ product?: OffRawProduct; status?: string }>(
    `/api/v3.6/product/${clean}?fields=${V3_FIELDS}`,
  );
  if (!data?.product) return null;
  return normalize(data.product);
}

// The nutrition-facts rows we surface, in display order.
const NUTRITION_ROWS: { key: string; label: string }[] = [
  { key: "energy-kcal", label: "Energy" },
  { key: "fat", label: "Fat" },
  { key: "saturated-fat", label: "Saturated fat" },
  { key: "carbohydrates", label: "Carbohydrates" },
  { key: "sugars", label: "of which sugars" },
  { key: "fiber", label: "Fiber" },
  { key: "proteins", label: "Protein" },
  { key: "salt", label: "Salt" },
];

// "en:palm-oil" -> "Palm Oil"; strips the language prefix, de-slugs, title-cases.
function prettyTag(tag: string): string {
  const i = tag.indexOf(":");
  const slug = i === -1 ? tag : tag.slice(i + 1);
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Rich product profile for the detail page (v3.6, extra fields).
export async function fetchProductDetail(barcode: string): Promise<ProductDetail | null> {
  const clean = barcode.replace(/\D/g, "");
  if (!clean) return null;
  const data = await offFetch<{ product?: OffRawProduct }>(
    `/api/v3.6/product/${clean}?fields=${DETAIL_FIELDS}`,
  );
  const raw = data?.product;
  const code = raw?.code?.trim();
  const name = raw?.product_name?.trim();
  if (!raw || !code || !name) return null;

  const nutrients = raw.nutrition?.aggregated_set?.nutrients ?? {};
  const nutrition: NutritionRow[] = [];
  for (const { key, label } of NUTRITION_ROWS) {
    const v = num(nutrients[key]?.value);
    if (v != null) {
      // OFF computed values can carry many decimals — energy whole, grams to 1dp.
      const value = key === "energy-kcal" ? Math.round(v) : Math.round(v * 10) / 10;
      nutrition.push({ label, value, unit: nutrients[key]?.unit || (key === "energy-kcal" ? "kcal" : "g") });
    }
  }

  const eco =
    raw.environmental_score_grade && raw.environmental_score_grade !== "unknown"
      ? raw.environmental_score_grade.toLowerCase()
      : null;

  return {
    barcode: code,
    name,
    brand: raw.brands?.split(",")[0]?.trim() || null,
    image: raw.image_front_url || raw.image_front_small_url || raw.image_url || raw.image_small_url || null,
    quantity: raw.quantity?.trim() || null,
    servingSize: raw.serving_size?.trim() || null,
    nutriscore: raw.nutriscore_grade?.toLowerCase() || null,
    novaGroup: num(raw.nova_group),
    ecoGrade: eco,
    nutrition,
    ingredientsText: raw.ingredients_text?.trim() || null,
    allergens: (raw.allergens_tags ?? []).map(prettyTag),
    additives: (raw.additives_tags ?? []).map((t) => prettyTag(t).toUpperCase()),
    labels: (raw.labels_tags ?? [])
      .filter((t) => /^en:[a-z0-9-]+$/.test(t)) // canonical English slugs only (drops mis-cased French)
      .map(prettyTag)
      .slice(0, 10),
    categories: (raw.categories_tags ?? [])
      .filter((t) => /^en:[a-z0-9-]+$/.test(t))
      .map(prettyTag)
      .slice(0, 10),
    countries: (raw.countries_tags ?? [])
      .filter((t) => /^en:[a-z0-9-]+$/.test(t)) // canonical English slugs only
      .map(prettyTag)
      .slice(0, 16),
    values: extractValues(raw),
    categoriesTags: raw.categories_tags ?? [],
    popularity: raw.unique_scans_n ?? 0,
  };
}

// Products in a category, most-scanned first. Uses the CGI search with a
// category tag filter — the v2/v3 /search endpoints are flaky/often unavailable,
// whereas this one is reliable and respects the same fields/sort params.
// Adds an OFF CGI country tag-filter at the given filter index (0, 1, …).
function applyCountry(params: URLSearchParams, country: string, index: number) {
  if (!country) return;
  params.set(`tagtype_${index}`, "countries");
  params.set(`tag_contains_${index}`, "contains");
  params.set(`tag_${index}`, country);
}

async function searchCategory(categorySlug: string, country = ""): Promise<NormalizedProduct[]> {
  const params = new URLSearchParams({
    action: "process",
    tagtype_0: "categories",
    tag_contains_0: "contains",
    tag_0: categorySlug,
    sort_by: "unique_scans_n", // most-scanned first => recognizable products
    page_size: "50",
    json: "1",
    fields: FIELDS,
  });
  applyCountry(params, country, 1);
  const data = await offFetch<{ products?: OffRawProduct[] }>(`/cgi/search.pl?${params}`);
  if (!data?.products) return [];
  return data.products.map(normalize).filter((p): p is NormalizedProduct => p !== null);
}

// Strip the language prefix off a category tag ("en:carbonated-drinks" -> "carbonated-drinks").
function categorySlug(tag: string): string {
  const i = tag.indexOf(":");
  return i === -1 ? tag : tag.slice(i + 1);
}

// Canonical English tag: lowercase slug only (e.g. "en:sweet-spreads"). v3.6's
// categories_tags also contains untranslated display values like
// "en:Petit-déjeuners" — excluded here so we only search real category slugs.
const CANONICAL_EN_TAG = /^en:[a-z0-9-]+$/;

// Build a candidate pool from the SAME category as the product. Prefers canonical
// English category tags (better global results), tries the most specific first
// (so chips swap for chips), and widens to broader categories only if the narrow
// one is too thin to offer real choices.
export async function fetchCandidatePool(
  product: NormalizedProduct,
  country = "",
  minPool = 12,
): Promise<NormalizedProduct[]> {
  const enTags = product.categoriesTags.filter((t) => CANONICAL_EN_TAG.test(t));
  const tags = (enTags.length ? enTags : product.categoriesTags).slice().reverse();

  // Strictly within the chosen country — no global fallback, so we never suggest
  // products the user can't buy where they are. If a product has no in-country
  // alternatives, it simply gets no swaps.
  const pool = new Map<string, NormalizedProduct>();
  for (const tag of tags) {
    const results = await searchCategory(categorySlug(tag), country);
    for (const r of results) {
      if (r.barcode !== product.barcode) pool.set(r.barcode, r);
    }
    if (pool.size >= minPool) break;
  }
  return [...pool.values()];
}
