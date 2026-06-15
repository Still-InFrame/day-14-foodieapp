import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissionKey } from "@/lib/missions";
import { isCountrySlug } from "@/lib/countries";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

// Update the signed-in user's profile (handle, display name, default mission,
// public visibility). Handles are stored lowercased and are case-insensitively
// unique (DB index); a clash returns 409.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    handle?: string | null;
    display_name?: string | null;
    default_mission?: string;
    is_public?: boolean;
    country?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.handle !== undefined) {
    const h = (body.handle ?? "").trim().toLowerCase();
    if (h === "") {
      update.handle = null;
    } else if (!HANDLE_RE.test(h)) {
      return NextResponse.json(
        { error: "Handle must be 3–20 chars: letters, numbers, underscores." },
        { status: 400 },
      );
    } else {
      update.handle = h;
    }
  }
  if (body.display_name !== undefined) {
    update.display_name = (body.display_name ?? "").trim().slice(0, 40) || null;
  }
  if (body.default_mission !== undefined && isMissionKey(body.default_mission)) {
    update.default_mission = body.default_mission;
  }
  if (body.country !== undefined && isCountrySlug(body.country)) {
    update.country = body.country;
  }
  if (typeof body.is_public === "boolean") {
    update.is_public = body.is_public;
  }

  // Can't go public without a handle (the profile URL needs one).
  if (update.is_public === true) {
    const { data: current } = await supabase
      .from("foodieapp_profiles")
      .select("handle")
      .eq("user_id", user.id)
      .maybeSingle();
    const effectiveHandle = update.handle ?? current?.handle;
    if (!effectiveHandle) {
      return NextResponse.json(
        { error: "Set a handle before making your profile public." },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase
    .from("foodieapp_profiles")
    .update(update)
    .eq("user_id", user.id)
    .select("handle, display_name, default_mission, is_public, country")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That handle is taken." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, profile: data });
}
