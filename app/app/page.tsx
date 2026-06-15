import { SwapStudio } from "@/components/SwapStudio";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { computeDashboard } from "@/lib/dashboard";
import { DEFAULT_MISSION, isMissionKey, type MissionKey } from "@/lib/missions";
import { DEFAULT_COUNTRY } from "@/lib/countries";

export const dynamic = "force-dynamic";

export default async function AppHome({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  const [profile, sp] = await Promise.all([ensureProfile(), searchParams]);

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("foodieapp_swaps")
    .select("mission, delta, created_at");
  const dashboard = computeDashboard(rows ?? [], Date.now());

  const defaultMission: MissionKey =
    profile && isMissionKey(profile.default_mission)
      ? (profile.default_mission as MissionKey)
      : DEFAULT_MISSION;

  return (
    <SwapStudio
      defaultMission={defaultMission}
      initialBarcode={sp.barcode}
      dashboard={dashboard}
      country={profile?.country ?? DEFAULT_COUNTRY}
    />
  );
}
