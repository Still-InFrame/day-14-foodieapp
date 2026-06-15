import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MISSIONS, isMissionKey } from "@/lib/missions";

export const dynamic = "force-dynamic";

interface LeaderRow {
  handle: string;
  display_name: string | null;
  swap_count: number;
}
interface PopularRow {
  original_name: string;
  swap_name: string;
  mission: string;
  n: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function DiscoverPage() {
  const supabase = await createClient();
  const [{ data: leaders }, { data: popular }] = await Promise.all([
    supabase.rpc("foodieapp_leaderboard", { limit_n: 10 }),
    supabase.rpc("foodieapp_popular_swaps", { limit_n: 8 }),
  ]);

  const leaderRows = (leaders ?? []) as LeaderRow[];
  const popularRows = (popular ?? []) as PopularRow[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Discover</h1>
        <p className="mt-1 text-sm text-ink-soft">
          See what the community is swapping and who&apos;s leading the pack.
        </p>
      </div>

      {/* Community swaps */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-ink">Popular swaps</h2>
        {popularRows.length === 0 ? (
          <p className="text-sm text-ink-soft">No community swaps yet — be the first.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {popularRows.map((p, i) => {
              const m = isMissionKey(p.mission) ? MISSIONS[p.mission] : null;
              return (
                <div
                  key={`${p.original_name}-${p.swap_name}-${i}`}
                  className="flex items-center gap-3 rounded-2xl border border-cream-deep bg-white p-4"
                >
                  <span className="text-xl">{m?.emoji ?? "🔁"}</span>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="text-ink-soft line-through">{p.original_name}</span>
                    <span className="mx-1.5 font-bold text-brand">→</span>
                    <span className="font-bold text-ink">{p.swap_name}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-bold text-brand-dark">
                    {p.n} member{p.n === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-ink">Leaderboard</h2>
        {leaderRows.length === 0 ? (
          <p className="text-sm text-ink-soft">No public members yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderRows.map((l, i) => (
              <Link
                key={l.handle}
                href={`/u/${l.handle}`}
                className="flex items-center gap-3 rounded-2xl border border-cream-deep bg-white p-3 transition hover:border-brand"
              >
                <span className="w-7 text-center text-lg font-extrabold text-ink-soft">
                  {MEDALS[i] ?? i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white">
                  {(l.display_name || l.handle).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-ink">{l.display_name || l.handle}</div>
                  <div className="truncate text-xs text-ink-soft">@{l.handle}</div>
                </div>
                <span className="shrink-0 text-sm font-bold text-ink">
                  {l.swap_count} swap{l.swap_count === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
