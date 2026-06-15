import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ImpactView, type SwapRow } from "@/components/ImpactView";
import { ensureProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const profile = await ensureProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("foodieapp_swaps")
    .select("id, created_at, mission, original_name, original_barcode, swap_name, swap_barcode, delta")
    .order("created_at", { ascending: false });

  const swaps = (data ?? []) as SwapRow[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Your impact</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {swaps.length > 0
              ? `${swaps.length} swap${swaps.length === 1 ? "" : "s"} and counting. Keep it up.`
              : "Make your first swap and watch it add up here."}
          </p>
        </div>
        {profile?.is_public && profile.handle && (
          <Link
            href={`/u/${profile.handle}`}
            className="shrink-0 rounded-full border border-cream-deep px-4 py-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
          >
            View public profile
          </Link>
        )}
      </div>

      {swaps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cream-deep bg-white p-12 text-center">
          <div className="text-4xl">🔁</div>
          <p className="mt-3 font-bold text-ink">No swaps yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Find a product and accept a better pick to start your streak.
          </p>
          <Link
            href="/app"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white transition hover:bg-brand-dark"
          >
            Find a swap
          </Link>
        </div>
      ) : (
        <ImpactView swaps={swaps} />
      )}
    </div>
  );
}
