import Link from "next/link";
import { fetchProductDetail } from "@/lib/off";
import { NutriScore } from "@/components/NutriScore";
import type { ProductDetail } from "@/lib/types";

const NOVA_COLOR: Record<number, string> = {
  1: "var(--color-grade-a)",
  2: "var(--color-grade-b)",
  3: "var(--color-grade-c)",
  4: "var(--color-grade-e)",
};

// The metrics we line up, and which direction counts as "better".
const METRICS: { label: string; dir: "min" | "max" }[] = [
  { label: "Energy", dir: "min" },
  { label: "Fat", dir: "min" },
  { label: "Saturated fat", dir: "min" },
  { label: "Carbohydrates", dir: "min" },
  { label: "of which sugars", dir: "min" },
  { label: "Fiber", dir: "max" },
  { label: "Protein", dir: "max" },
  { label: "Salt", dir: "min" },
];

function nutMap(p: ProductDetail): Record<string, { value: number; unit: string }> {
  const m: Record<string, { value: number; unit: string }> = {};
  for (const r of p.nutrition) m[r.label] = { value: r.value, unit: r.unit };
  return m;
}

/* eslint-disable @next/next/no-img-element */
function ProductHead({ p, tone, label }: { p: ProductDetail; tone: "from" | "to"; label: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center ${
        tone === "from" ? "border-accent/30 bg-accent-tint/30" : "border-brand/30 bg-brand-tint/40"
      }`}
    >
      <span
        className={`text-xs font-bold uppercase tracking-wide ${
          tone === "from" ? "text-accent" : "text-brand-dark"
        }`}
      >
        {label}
      </span>
      <Link href={`/app/product/${p.barcode}`} className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white">
          {p.image ? (
            <img src={p.image} alt={p.name} className="max-h-20 max-w-20 object-contain" />
          ) : (
            <span className="text-3xl">🍽️</span>
          )}
        </div>
        <div className="line-clamp-2 text-sm font-extrabold text-ink hover:underline">{p.name}</div>
      </Link>
      <NutriScore grade={p.nutriscore} size={24} />
    </div>
  );
}

function Cell({
  value,
  unit,
  better,
  label,
}: {
  value: number | null;
  unit: string;
  better: boolean;
  label?: string;
}) {
  if (value == null) return <span className="text-ink-soft">—</span>;
  return (
    <span
      className={
        better ? "rounded-full bg-brand-tint px-2.5 py-0.5 font-extrabold text-brand-dark" : "text-ink"
      }
    >
      {label ?? `${value} ${unit}`}
    </span>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const [a, b] = await Promise.all([
    from ? fetchProductDetail(from) : Promise.resolve(null),
    to ? fetchProductDetail(to) : Promise.resolve(null),
  ]);

  if (!a || !b) {
    return (
      <div className="py-20 text-center">
        <div className="text-4xl">🔍</div>
        <p className="mt-3 text-lg font-bold text-ink">Couldn&apos;t load this comparison</p>
        <p className="mt-1 text-sm text-ink-soft">One of these products isn&apos;t in the database.</p>
        <Link href="/app" className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white">
          Back to swaps
        </Link>
      </div>
    );
  }

  const am = nutMap(a);
  const bm = nutMap(b);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/app" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Back
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">The swap, compared</h1>
        <p className="mt-1 text-sm text-ink-soft">Greener cell wins on each line.</p>
      </div>

      {/* Heads */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <ProductHead p={a} tone="from" label="Was eating" />
        <span className="text-2xl font-extrabold text-brand">→</span>
        <ProductHead p={b} tone="to" label="Swapped to" />
      </div>

      {/* Comparison table */}
      <div className="overflow-hidden rounded-3xl border border-cream-deep bg-white">
        <table className="w-full text-sm">
          <tbody>
            {/* Processing row */}
            {(a.novaGroup || b.novaGroup) && (
              <tr className="border-b border-cream-deep">
                <td className="px-4 py-3 text-ink-soft">Processing</td>
                <td className="px-4 py-3 text-right">
                  <Cell
                    value={a.novaGroup}
                    unit=""
                    label={a.novaGroup ? `NOVA ${a.novaGroup}` : undefined}
                    better={!!a.novaGroup && !!b.novaGroup && a.novaGroup < b.novaGroup}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Cell
                    value={b.novaGroup}
                    unit=""
                    label={b.novaGroup ? `NOVA ${b.novaGroup}` : undefined}
                    better={!!a.novaGroup && !!b.novaGroup && b.novaGroup < a.novaGroup}
                  />
                </td>
              </tr>
            )}
            {METRICS.map(({ label, dir }) => {
              const av = am[label]?.value ?? null;
              const bv = bm[label]?.value ?? null;
              if (av == null && bv == null) return null;
              const unit = am[label]?.unit ?? bm[label]?.unit ?? "";
              let aBetter = false;
              let bBetter = false;
              if (av != null && bv != null && av !== bv) {
                const aWins = dir === "min" ? av < bv : av > bv;
                aBetter = aWins;
                bBetter = !aWins;
              }
              return (
                <tr key={label} className="border-b border-cream-deep last:border-0">
                  <td className="px-4 py-3 text-ink-soft">{label}</td>
                  <td className="px-4 py-3 text-right">
                    <Cell value={av} unit={unit} better={aBetter} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Cell value={bv} unit={unit} better={bBetter} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-ink-soft">
        Per 100 g / 100 ml · data from Open Food Facts
      </p>
    </div>
  );
}
