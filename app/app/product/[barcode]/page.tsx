import Link from "next/link";
import { fetchProductDetail, fetchCandidatePool } from "@/lib/off";
import { rankSwaps } from "@/lib/swapEngine";
import { NutriScore } from "@/components/NutriScore";
import { fmtDelta } from "@/lib/format";
import { ensureProfile } from "@/lib/profile";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import type { NormalizedProduct } from "@/lib/types";

const NOVA: Record<number, { label: string; color: string }> = {
  1: { label: "Unprocessed or minimally processed", color: "var(--color-grade-a)" },
  2: { label: "Processed culinary ingredient", color: "var(--color-grade-b)" },
  3: { label: "Processed food", color: "var(--color-grade-c)" },
  4: { label: "Ultra-processed", color: "var(--color-grade-e)" },
};

function Chips({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "warn" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => (
        <span
          key={c}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tone === "warn" ? "bg-accent-tint text-accent" : "bg-cream-deep text-ink-soft"
          }`}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
export default async function ProductPage({ params }: { params: Promise<{ barcode: string }> }) {
  const { barcode } = await params;
  const p = await fetchProductDetail(barcode);

  if (!p) {
    return (
      <div className="py-20 text-center">
        <div className="text-4xl">🔍</div>
        <p className="mt-3 text-lg font-bold text-ink">Product not found</p>
        <p className="mt-1 text-sm text-ink-soft">
          This barcode isn&apos;t in the Open Food Facts database yet.
        </p>
        <Link href="/app" className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white">
          Back to search
        </Link>
      </div>
    );
  }

  const normalized: NormalizedProduct = {
    barcode: p.barcode,
    name: p.name,
    brand: p.brand,
    image: p.image,
    nutriscore: p.nutriscore,
    popularity: p.popularity,
    categoriesTags: p.categoriesTags,
    values: p.values,
  };
  const profile = await ensureProfile();
  const candidates = await fetchCandidatePool(normalized, profile?.country ?? DEFAULT_COUNTRY);
  const swaps = rankSwaps(normalized, candidates, "calories", 3);
  const nova = p.novaGroup ? NOVA[p.novaGroup] : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Back to swaps
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-5 rounded-3xl border border-cream-deep bg-white p-6 sm:flex-row sm:items-center">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center self-center rounded-2xl bg-cream-deep/40 sm:self-auto">
          {p.image ? (
            <img src={p.image} alt={p.name} className="max-h-32 max-w-32 rounded-xl object-contain" />
          ) : (
            <span className="text-4xl">🍽️</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{p.name}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {[p.brand, p.quantity].filter(Boolean).join(" · ") || "Unknown brand"}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {p.nutriscore && (
              <span className="flex items-center gap-1.5 rounded-full bg-cream-deep/50 py-1 pl-1 pr-3 text-xs font-bold text-ink-soft">
                <NutriScore grade={p.nutriscore} size={22} /> Nutri-Score
              </span>
            )}
            {nova && (
              <span
                className="rounded-full px-3 py-1.5 text-xs font-bold text-white"
                style={{ backgroundColor: nova.color }}
              >
                NOVA {p.novaGroup}
              </span>
            )}
            {p.ecoGrade && (
              <span className="rounded-full bg-brand-tint px-3 py-1.5 text-xs font-bold text-brand-dark">
                Green-Score {p.ecoGrade.toUpperCase()}
              </span>
            )}
          </div>
          <Link
            href={`/app?barcode=${p.barcode}`}
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Find better swaps →
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Nutrition */}
        {p.nutrition.length > 0 && (
          <div className="rounded-3xl border border-cream-deep bg-white p-6">
            <h2 className="text-lg font-extrabold text-ink">Nutrition</h2>
            <p className="mb-3 text-xs text-ink-soft">per 100 g / 100 ml</p>
            <dl className="divide-y divide-cream-deep">
              {p.nutrition.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 text-sm">
                  <dt className="text-ink-soft">{row.label}</dt>
                  <dd className="font-bold text-ink">
                    {row.value} {row.unit}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Processing */}
        <div className="flex flex-col gap-4 rounded-3xl border border-cream-deep bg-white p-6">
          <div>
            <h2 className="text-lg font-extrabold text-ink">Processing</h2>
            {nova ? (
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
                  style={{ backgroundColor: nova.color }}
                >
                  {p.novaGroup}
                </span>
                <div>
                  <div className="font-bold text-ink">NOVA group {p.novaGroup}</div>
                  <div className="text-sm text-ink-soft">{nova.label}</div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">No processing data.</p>
            )}
          </div>
          {p.additives.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-bold text-ink">Additives</div>
              <Chips items={p.additives} tone="warn" />
            </div>
          )}
          {p.allergens.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-bold text-ink">Allergens</div>
              <Chips items={p.allergens} tone="warn" />
            </div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      {p.ingredientsText && (
        <div className="rounded-3xl border border-cream-deep bg-white p-6">
          <h2 className="text-lg font-extrabold text-ink">Ingredients</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.ingredientsText}</p>
        </div>
      )}

      {/* Categories, labels & countries */}
      {(p.categories.length > 0 || p.labels.length > 0 || p.countries.length > 0) && (
        <div className="rounded-3xl border border-cream-deep bg-white p-6">
          {p.categories.length > 0 && (
            <>
              <h2 className="text-lg font-extrabold text-ink">Categories</h2>
              <div className="mt-3">
                <Chips items={p.categories} />
              </div>
            </>
          )}
          {p.labels.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-bold text-ink">Labels</h3>
              <div className="mt-2">
                <Chips items={p.labels} />
              </div>
            </>
          )}
          {p.countries.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-bold text-ink">Sold in</h3>
              <div className="mt-2">
                <Chips items={p.countries} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Better swaps preview */}
      {swaps.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-extrabold text-ink">
            Lighter swaps <span className="font-normal text-ink-soft">(fewer calories)</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {swaps.map(({ product, delta }) => (
              <Link
                key={product.barcode}
                href={`/app/product/${product.barcode}`}
                className="flex flex-col rounded-2xl border border-cream-deep bg-white p-4 transition hover:border-brand hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-contain" />
                  ) : (
                    <span className="text-2xl">🍽️</span>
                  )}
                  <span className="rounded-full bg-brand-tint px-2.5 py-1 text-sm font-extrabold text-brand-dark">
                    {fmtDelta("calories", delta)}
                  </span>
                </div>
                <div className="mt-3 line-clamp-2 font-bold leading-tight text-ink">{product.name}</div>
                {product.brand && <div className="truncate text-xs text-ink-soft">{product.brand}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-ink-soft">
        Data from Open Food Facts · barcode {p.barcode}
      </p>
    </div>
  );
}
