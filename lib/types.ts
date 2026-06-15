import type { MissionKey } from "./missions";

// A product flattened to exactly what the app needs, normalized once at the
// Open Food Facts boundary so the rest of the app never touches raw OFF shapes.
export interface NormalizedProduct {
  barcode: string;
  name: string;
  brand: string | null;
  image: string | null;
  nutriscore: string | null; // "a".."e"
  popularity: number; // OFF unique_scans_n — proxy for "would someone recognize this"
  categoriesTags: string[]; // general -> specific
  // Per-mission value, all on a per-100g basis (nova = group 1-4, eco = 0-100 score).
  values: Record<MissionKey, number | null>;
}

// One suggested swap: the better product plus the signed improvement on the
// active mission (always positive — bigger is a better swap).
export interface SwapResult {
  product: NormalizedProduct;
  delta: number;
}

// A single line in the nutrition-facts table on a product detail page.
export interface NutritionRow {
  label: string;
  value: number;
  unit: string;
}

// Rich product profile shown on /app/product/[barcode]. Superset of
// NormalizedProduct with the extra fields a detail page needs.
export interface ProductDetail {
  barcode: string;
  name: string;
  brand: string | null;
  image: string | null;
  quantity: string | null;
  servingSize: string | null;
  nutriscore: string | null;
  novaGroup: number | null;
  ecoGrade: string | null;
  nutrition: NutritionRow[]; // per 100g
  ingredientsText: string | null;
  allergens: string[];
  additives: string[];
  labels: string[];
  categories: string[];
  countries: string[]; // countries the product is sold in
  values: Record<MissionKey, number | null>; // for the swap engine
  categoriesTags: string[];
  popularity: number;
}
