import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissionKey } from "@/lib/missions";

interface PackedProduct {
  barcode?: string;
  name?: string;
  brand?: string | null;
  image?: string | null;
  value?: number | null;
}

// Persist an accepted swap. RLS guarantees a user can only insert their own row;
// we additionally stamp user_id from the session so the WITH CHECK passes.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    mission?: string;
    delta?: number;
    original?: PackedProduct;
    swap?: PackedProduct;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { mission, delta, original, swap } = body;
  if (!mission || !isMissionKey(mission) || typeof delta !== "number" || !original || !swap) {
    return NextResponse.json({ error: "invalid swap payload" }, { status: 400 });
  }

  const { error } = await supabase.from("foodieapp_swaps").insert({
    user_id: user.id,
    mission,
    delta,
    original_barcode: original.barcode ?? null,
    original_name: original.name ?? null,
    original_brand: original.brand ?? null,
    original_image: original.image ?? null,
    original_value: original.value ?? null,
    swap_barcode: swap.barcode ?? null,
    swap_name: swap.name ?? null,
    swap_brand: swap.brand ?? null,
    swap_image: swap.image ?? null,
    swap_value: swap.value ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
