import { NextResponse, type NextRequest } from "next/server";
import { fetchProduct, fetchCandidatePool } from "@/lib/off";

// Given a product barcode, return the product plus a same-category candidate
// pool (already filtered to recognizable, complete products). The client ranks
// the pool per mission so the live mission toggle re-ranks with no refetch.
// Auth is enforced upstream by middleware.
export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get("barcode");
  const country = request.nextUrl.searchParams.get("country") ?? "";
  if (!barcode) return NextResponse.json({ error: "barcode required" }, { status: 400 });

  const original = await fetchProduct(barcode);
  if (!original) return NextResponse.json({ error: "product not found" }, { status: 404 });

  const candidates = await fetchCandidatePool(original, country);
  return NextResponse.json({ original, candidates });
}
