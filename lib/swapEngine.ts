import { MISSIONS, type MissionKey } from "./missions";
import type { NormalizedProduct, SwapResult } from "./types";

// Pure ranking logic — no network. Runs on the server to build the candidate
// pool's results AND in the browser so the live mission toggle re-ranks an
// already-fetched pool instantly with no refetch.

// Signed improvement of `swap` over `original` on the mission axis.
// Positive = genuinely better. Null if either side is missing the value.
function improvement(
  original: NormalizedProduct,
  swap: NormalizedProduct,
  mission: MissionKey,
): number | null {
  const o = original.values[mission];
  const s = swap.values[mission];
  if (o == null || s == null) return null;
  return MISSIONS[mission].direction === "min" ? o - s : s - o;
}

// True when a candidate clears the mission's minimum-improvement threshold.
function isMeaningfulSwap(
  original: NormalizedProduct,
  swap: NormalizedProduct,
  mission: MissionKey,
): boolean {
  const imp = improvement(original, swap, mission);
  return imp != null && imp >= MISSIONS[mission].threshold;
}

// Rank a pre-fetched candidate pool for one mission and return the top swaps.
// Filters out the same product, duplicates, and anything not meaningfully better;
// orders by improvement, breaking ties toward more recognizable products.
export function rankSwaps(
  original: NormalizedProduct,
  candidates: NormalizedProduct[],
  mission: MissionKey,
  limit = 3,
): SwapResult[] {
  const seen = new Set<string>([original.barcode, dedupeKey(original)]);
  const ranked: SwapResult[] = [];

  for (const candidate of candidates) {
    const key = dedupeKey(candidate);
    if (seen.has(candidate.barcode) || seen.has(key)) continue;
    if (!candidate.name || !candidate.image) continue;
    if (!isMeaningfulSwap(original, candidate, mission)) continue;

    seen.add(candidate.barcode);
    seen.add(key);
    ranked.push({ product: candidate, delta: improvement(original, candidate, mission)! });
  }

  ranked.sort((a, b) => {
    if (b.delta !== a.delta) return b.delta - a.delta;
    return b.product.popularity - a.product.popularity;
  });

  return ranked.slice(0, limit);
}

function dedupeKey(p: NormalizedProduct): string {
  return `${(p.brand ?? "").toLowerCase().trim()}|${p.name.toLowerCase().trim()}`;
}
