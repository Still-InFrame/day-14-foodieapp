import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ImpactView, type SwapRow } from "@/components/ImpactView";
import { MISSIONS, isMissionKey } from "@/lib/missions";
import { countryFlag, countryLabel } from "@/lib/countries";

export const dynamic = "force-dynamic";

// Members-only public profile. Middleware blocks logged-out visitors; RLS lets a
// logged-in member read a profile only when its owner set is_public = true.
export default async function PublicProfile({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("foodieapp_profiles")
    .select("user_id, handle, display_name, default_mission, is_public, country")
    .eq("handle", handle.toLowerCase())
    .eq("is_public", true)
    .maybeSingle();

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-cream-deep bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/app">
            <Logo />
          </Link>
          <Link
            href="/app/discover"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            Discover
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  );

  if (!profile) {
    return shell(
      <div className="py-20 text-center">
        <div className="text-4xl">🔍</div>
        <p className="mt-3 text-lg font-bold text-ink">Profile not found</p>
        <p className="mt-1 text-sm text-ink-soft">
          This member doesn&apos;t exist or hasn&apos;t made their profile public.
        </p>
        <Link
          href="/app/discover"
          className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white"
        >
          Browse members
        </Link>
      </div>,
    );
  }

  const { data } = await supabase
    .from("foodieapp_swaps")
    .select("id, created_at, mission, original_name, original_barcode, swap_name, swap_barcode, delta")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false });
  const swaps = (data ?? []) as SwapRow[];

  const name = profile.display_name || profile.handle;
  const mission = isMissionKey(profile.default_mission) ? MISSIONS[profile.default_mission] : null;

  return shell(
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-2xl font-extrabold text-white">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{name}</h1>
          <p className="text-sm text-ink-soft">
            @{profile.handle}
            {" · "}
            {countryFlag(profile.country)} {countryLabel(profile.country)}
            {mission && (
              <>
                {" · "}
                {mission.emoji} {mission.label}
              </>
            )}
            {" · "}
            {swaps.length} swap{swaps.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {swaps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cream-deep bg-white p-12 text-center text-ink-soft">
          No swaps shared yet.
        </div>
      ) : (
        <ImpactView swaps={swaps} />
      )}
    </div>,
  );
}
