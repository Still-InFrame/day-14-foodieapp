import { createClient } from "@/lib/supabase/server";
import { DEFAULT_MISSION } from "@/lib/missions";
import { DEFAULT_COUNTRY } from "@/lib/countries";

export interface Profile {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  default_mission: string;
  is_public: boolean;
  country: string;
}

const PROFILE_COLUMNS = "user_id, handle, display_name, default_mission, is_public, country";

// Ensures the signed-in user has a profile row, creating a private one on first
// visit. Profile creation lives in app code (not an auth trigger) to avoid
// touching the shared sandbox's auth schema. Returns the profile or null if
// somehow unauthenticated.
export async function ensureProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("foodieapp_profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing as Profile;

  const seed = {
    user_id: user.id,
    display_name: (user.email ?? "").split("@")[0] || null,
    default_mission: DEFAULT_MISSION,
    is_public: false,
    country: DEFAULT_COUNTRY,
  };
  const { data: created } = await supabase
    .from("foodieapp_profiles")
    .insert(seed)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  return (created as Profile) ?? null;
}
