import { createClient } from "@/lib/supabase/server";
import { LandingClient } from "@/components/landing/LandingClient";

export const dynamic = "force-dynamic"; // always show the live counter

export default async function Landing() {
  const supabase = await createClient();
  const [{ data: total }, { data: userData }] = await Promise.all([
    supabase.rpc("get_total_swaps"),
    supabase.auth.getUser(),
  ]);

  return (
    <LandingClient
      totalSwaps={typeof total === "number" ? total : 0}
      loggedIn={Boolean(userData.user)}
    />
  );
}
