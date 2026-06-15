"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MISSION_LIST, MISSIONS, type MissionKey } from "@/lib/missions";
import { rankSwaps } from "@/lib/swapEngine";
import type { NormalizedProduct } from "@/lib/types";
import { fmtValue, fmtDelta } from "@/lib/format";
import { NutriScore } from "@/components/NutriScore";
import { ShareButton } from "@/components/ShareButton";
import { Dashboard } from "@/components/Dashboard";
import { countryLabel } from "@/lib/countries";
import type { DashboardData } from "@/lib/dashboard";

// Lazy + client-only: keeps the ZXing camera lib out of SSR and the main bundle.
const BarcodeScanner = dynamic(
  () => import("@/components/BarcodeScanner").then((m) => m.BarcodeScanner),
  { ssr: false },
);

const EXAMPLES = ["Coca-Cola", "Nutella", "Doritos", "Oreo", "Pringles"];

function Thumb({ product, size }: { product: NormalizedProduct; size: number }) {
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={product.image}
        alt={product.name}
        width={size}
        height={size}
        loading="lazy"
        className="rounded-xl object-contain"
        style={{ width: size, height: size, background: "#fff" }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-cream-deep text-2xl"
      style={{ width: size, height: size }}
    >
      🍽️
    </div>
  );
}

export function SwapStudio({
  defaultMission,
  initialBarcode,
  dashboard,
  country = "",
}: {
  defaultMission: MissionKey;
  initialBarcode?: string;
  dashboard?: DashboardData;
  country?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NormalizedProduct[] | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const [original, setOriginal] = useState<NormalizedProduct | null>(null);
  const [candidates, setCandidates] = useState<NormalizedProduct[]>([]);
  const [loadingSwaps, setLoadingSwaps] = useState(false);

  const [mission, setMission] = useState<MissionKey>(defaultMission);
  const [accepted, setAccepted] = useState<Record<string, "saving" | "saved">>({});
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Debounced autocomplete: fetch product suggestions as the user types,
  // aborting any in-flight request so only the latest query resolves.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`,
          { signal: ctrl.signal },
        );
        const data = await res.json();
        setSuggestions((data.products ?? []).slice(0, 8));
        setOpen(true);
        setHighlight(-1);
      } catch {
        /* aborted or failed — leave previous suggestions in place */
      } finally {
        setSuggestLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  function choose(p: NormalizedProduct) {
    setOpen(false);
    setSuggestions(null);
    pickProduct(p);
  }

  function onSearchKeyDown(e: React.KeyboardEvent) {
    if (!open || !suggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  async function loadSwaps(barcode: string, fallback?: NormalizedProduct) {
    setSuggestions(null);
    setOpen(false);
    setQuery("");
    setLoadingSwaps(true);
    setError(null);
    setAccepted({});
    setOriginal(fallback ?? null);
    try {
      const res = await fetch(
        `/api/swaps?barcode=${encodeURIComponent(barcode)}&country=${encodeURIComponent(country)}`,
      );
      if (!res.ok) {
        setOriginal(null);
        setError("That product isn't in the Open Food Facts database yet. Try searching by name.");
        return;
      }
      const data = await res.json();
      setOriginal(data.original ?? fallback ?? null);
      setCandidates(data.candidates ?? []);
    } catch {
      setOriginal(null);
      setError("Couldn't load swaps — try again.");
    } finally {
      setLoadingSwaps(false);
    }
  }

  function pickProduct(p: NormalizedProduct) {
    loadSwaps(p.barcode, p);
  }

  function handleScan(code: string) {
    setScanning(false);
    loadSwaps(code);
  }

  // Auto-load swaps when arriving from a product page's "Find better swaps" CTA.
  useEffect(() => {
    if (initialBarcode) loadSwaps(initialBarcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swaps = useMemo(
    () => (original ? rankSwaps(original, candidates, mission) : []),
    [original, candidates, mission],
  );

  async function accept(swapProduct: NormalizedProduct, delta: number) {
    if (!original) return;
    setAccepted((a) => ({ ...a, [swapProduct.barcode]: "saving" }));
    try {
      const res = await fetch("/api/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission,
          delta,
          original: pack(original, mission),
          swap: pack(swapProduct, mission),
        }),
      });
      if (!res.ok) throw new Error();
      setAccepted((a) => ({ ...a, [swapProduct.barcode]: "saved" }));
    } catch {
      setAccepted((a) => {
        const next = { ...a };
        delete next[swapProduct.barcode];
        return next;
      });
      setError("Couldn't save that swap — try again.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="rounded-3xl border border-cream-deep bg-white p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">What are you eating?</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Search a product and we&apos;ll find better picks in the same category.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const p = suggestions?.[highlight >= 0 ? highlight : 0];
            if (p) choose(p);
          }}
          className="mt-4 flex gap-2"
        >
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              onFocus={() => suggestions && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              placeholder="Start typing… e.g. Coca-Cola, Nutella, Doritos"
              aria-label="Search products"
              autoComplete="off"
              className="w-full rounded-full border border-cream-deep bg-cream/40 px-5 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            {open && query.trim().length >= 2 && (suggestions || suggestLoading) && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-cream-deep bg-white shadow-xl">
                {suggestions && suggestions.length > 0 ? (
                  suggestions.map((p, i) => (
                    <button
                      type="button"
                      key={p.barcode}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        choose(p);
                      }}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                        highlight === i ? "bg-cream-deep/50" : "hover:bg-cream/60"
                      }`}
                    >
                      <Thumb product={p} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">{p.name}</span>
                        {p.brand && (
                          <span className="block truncate text-xs text-ink-soft">{p.brand}</span>
                        )}
                      </span>
                      <NutriScore grade={p.nutriscore} size={18} />
                    </button>
                  ))
                ) : suggestLoading ? (
                  <div className="px-4 py-3 text-sm text-ink-soft">Searching…</div>
                ) : (
                  <div className="px-4 py-3 text-sm text-ink-soft">No matches — try another name.</div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScanning(true)}
            aria-label="Scan a barcode"
            title="Scan a barcode"
            className="rounded-full border border-cream-deep bg-white px-4 py-3 font-bold text-ink-soft transition hover:border-brand hover:text-brand"
          >
            📷
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuery(ex);
                setOpen(true);
              }}
              className="rounded-full bg-cream-deep px-3 py-1 text-xs font-semibold text-ink-soft transition hover:text-ink"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {scanning && <BarcodeScanner onDetected={handleScan} onClose={() => setScanning(false)} />}

      {error && (
        <p className="rounded-xl bg-grade-e/10 px-4 py-3 text-sm text-grade-e">{error}</p>
      )}

      {/* Idle home state: show the user's dashboard */}
      {!original && !loadingSwaps && dashboard && <Dashboard data={dashboard} />}

      {loadingSwaps && (
        <div className="py-10 text-center text-ink-soft">Finding better swaps…</div>
      )}

      {/* Result: original + mission toggle + swaps */}
      {original && !loadingSwaps && (
        <div className="flex flex-col gap-5">
          {/* Your pick */}
          <div className="flex items-center gap-4 rounded-3xl border border-accent/30 bg-accent-tint/40 p-4">
            <Link
              href={`/app/product/${original.barcode}`}
              className="group flex min-w-0 flex-1 items-center gap-4"
            >
              <Thumb product={original} size={64} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-wide text-accent">Your pick</div>
                <div className="truncate text-lg font-extrabold text-ink group-hover:underline">
                  {original.name}
                </div>
                <div className="truncate text-sm text-ink-soft">
                  {original.brand ? `${original.brand} · ` : ""}
                  {fmtValue(mission, original.values[mission])} per 100g
                </div>
              </div>
            </Link>
            <NutriScore grade={original.nutriscore} size={34} />
          </div>

          {/* Live mission toggle */}
          <div>
            <div className="mb-2 text-sm font-semibold text-ink-soft">Optimize for:</div>
            <div className="flex flex-wrap gap-2">
              {MISSION_LIST.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMission(m.key)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    mission === m.key
                      ? "bg-brand text-white shadow-sm"
                      : "border border-cream-deep bg-white text-ink-soft hover:text-ink"
                  }`}
                >
                  <span className="mr-1">{m.emoji}</span>
                  {m.short}
                </button>
              ))}
            </div>
          </div>

          {/* Swaps */}
          <div>
            <h2 className="mb-3 text-lg font-extrabold text-ink">
              Better picks for{" "}
              <span className="text-brand">{MISSIONS[mission].label.toLowerCase()}</span>
            </h2>
            {swaps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cream-deep bg-white p-8 text-center text-ink-soft">
                {candidates.length === 0 ? (
                  country ? (
                    <>
                      No alternatives sold in {countryLabel(country)} for this product. Widen the
                      search in your{" "}
                      <Link href="/app/profile" className="font-semibold text-brand-dark underline">
                        profile
                      </Link>
                      .
                    </>
                  ) : (
                    <>No alternatives found for this product.</>
                  )
                ) : (
                  <>
                    No meaningfully better {MISSIONS[mission].short.toLowerCase()} swap in this
                    category. Try another goal above.
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {swaps.map(({ product, delta }) => {
                  const state = accepted[product.barcode];
                  return (
                    <div
                      key={product.barcode}
                      className="flex flex-col rounded-2xl border border-cream-deep bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/app/product/${product.barcode}`}>
                          <Thumb product={product} size={56} />
                        </Link>
                        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-sm font-extrabold text-brand-dark">
                          {fmtDelta(mission, delta)}
                        </span>
                      </div>
                      <div className="mt-3 flex-1">
                        <Link
                          href={`/app/product/${product.barcode}`}
                          className="line-clamp-2 font-bold leading-tight text-ink hover:underline"
                        >
                          {product.name}
                        </Link>
                        {product.brand && (
                          <div className="truncate text-xs text-ink-soft">{product.brand}</div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                          <NutriScore grade={product.nutriscore} size={18} />
                          {fmtValue(mission, product.values[mission])}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => accept(product, delta)}
                          disabled={Boolean(state)}
                          className={`flex-1 rounded-full py-2 text-sm font-bold transition ${
                            state === "saved"
                              ? "bg-brand-tint text-brand-dark"
                              : "bg-brand text-white hover:bg-brand-dark disabled:opacity-60"
                          }`}
                        >
                          {state === "saved" ? "Saved ✓" : state === "saving" ? "Saving…" : "Swap to this"}
                        </button>
                        <ShareButton
                          original={original.name}
                          swap={product.name}
                          mission={mission}
                          delta={delta}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Trim a product down to the fields we persist with a swap, capturing its value
// on the active mission so impact + community views have the numbers they need.
function pack(p: NormalizedProduct, mission: MissionKey) {
  return {
    barcode: p.barcode,
    name: p.name,
    brand: p.brand,
    image: p.image,
    value: p.values[mission],
  };
}
