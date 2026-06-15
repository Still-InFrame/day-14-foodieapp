import Link from "next/link";
import { ProfileSettings } from "@/components/ProfileSettings";
import { ensureProfile } from "@/lib/profile";
import { DEFAULT_MISSION, isMissionKey, type MissionKey } from "@/lib/missions";
import { DEFAULT_COUNTRY } from "@/lib/countries";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await ensureProfile();
  const defaultMission: MissionKey =
    profile && isMissionKey(profile.default_mission)
      ? (profile.default_mission as MissionKey)
      : DEFAULT_MISSION;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Set how you appear to other members and what you optimize for by default.
        </p>
      </div>

      <ProfileSettings
        initial={{
          handle: profile?.handle ?? "",
          display_name: profile?.display_name ?? "",
          default_mission: defaultMission,
          is_public: profile?.is_public ?? false,
          country: profile?.country ?? DEFAULT_COUNTRY,
        }}
      />

      {profile?.is_public && profile.handle && (
        <Link
          href={`/u/${profile.handle}`}
          className="text-center text-sm font-semibold text-brand-dark underline"
        >
          View your public profile →
        </Link>
      )}
    </div>
  );
}
