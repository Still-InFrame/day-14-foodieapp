import { NextResponse, type NextRequest } from "next/server";
import { searchByName } from "@/lib/off";

// Free-text product search for the "what are you eating now?" picker.
// Auth is enforced upstream by middleware.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const country = request.nextUrl.searchParams.get("country") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ products: [] });
  const products = await searchByName(q, country);
  return NextResponse.json({ products });
}
