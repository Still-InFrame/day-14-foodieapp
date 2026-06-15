import Link from "next/link";
import { MISSIONS, MISSION_LIST, isMissionKey, type MissionKey } from "@/lib/missions";
import { fmtDelta } from "@/lib/format";

export interface SwapRow {
  id: string;
  created_at: string;
  mission: string;
  original_name: string | null;
  original_barcode: string | null;
  swap_name: string | null;
  swap_barcode: string | null;
  delta: number | null;
}


function impactLabel(mission: MissionKey, sum: number): { big: string; verb: string } {
  return {
    big: fmtDelta(mission, sum),
    verb: MISSIONS[mission].direction === "min" ? "saved" : "gained",
  };
}

// Shared read-only impact display: per-mission totals + the swap list. Used by
// both the owner's impact page and public member profiles.
export function ImpactView({ swaps }: { swaps: SwapRow[] }) {
  const totals = new Map<MissionKey, { sum: number; count: number }>();
  for (const s of swaps) {
    if (!isMissionKey(s.mission)) continue;
    const t = totals.get(s.mission) ?? { sum: 0, count: 0 };
    t.sum += s.delta ?? 0;
    t.count += 1;
    totals.set(s.mission, t);
  }
  const activeMissions = MISSION_LIST.filter((m) => totals.has(m.key));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {activeMissions.map((m) => {
          const t = totals.get(m.key)!;
          const { big, verb } = impactLabel(m.key, t.sum);
          return (
            <div key={m.key} className="rounded-2xl border border-cream-deep bg-white p-5">
              <div className="text-2xl">{m.emoji}</div>
              <div className="mt-2 text-2xl font-extrabold text-ink">{big}</div>
              <div className="text-sm text-ink-soft">
                {m.short.toLowerCase()} {verb} · {t.count} swap{t.count === 1 ? "" : "s"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold text-ink">Swaps</h2>
        <div className="flex flex-col gap-2">
          {swaps.map((s) => {
            const comparable = s.original_barcode && s.swap_barcode;
            const cls = "flex items-center gap-3 rounded-2xl border border-cream-deep bg-white p-3";
            const inner = (
              <>
                <span
                  className="text-lg"
                  title={isMissionKey(s.mission) ? MISSIONS[s.mission].label : s.mission}
                >
                  {isMissionKey(s.mission) ? MISSIONS[s.mission].emoji : "🔁"}
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <span className="text-ink-soft line-through">{s.original_name ?? "—"}</span>
                  <span className="mx-1.5 font-bold text-brand">→</span>
                  <span className="font-bold text-ink">{s.swap_name ?? "—"}</span>
                </div>
                {s.delta != null && isMissionKey(s.mission) && (
                  <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-extrabold text-brand-dark">
                    {fmtDelta(s.mission, s.delta)}
                  </span>
                )}
              </>
            );
            return comparable ? (
              <Link
                key={s.id}
                href={`/app/compare?from=${s.original_barcode}&to=${s.swap_barcode}`}
                className={`${cls} transition hover:border-brand hover:shadow-sm`}
              >
                {inner}
              </Link>
            ) : (
              <div key={s.id} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
