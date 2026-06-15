"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NutriScore } from "@/components/NutriScore";

// Two infinite vertical columns scrolling in OPPOSITE directions: the "now"
// column (junk, red, bad scores) drifts up while the "better" column (green,
// good scores) drifts down — the product's whole premise told at a glance.
//
// Seamless-loop math: the track holds COPIES identical copies of the list with a
// flex `gap` of GAP px. scrollHeight has (COPIES*n - 1) gaps, so the TRUE height
// of one copy (which includes the gap leading into the next copy) is
// (scrollHeight + GAP) / COPIES. Translating by exactly that wraps with no jump.
// 3 copies also guarantees the tall column stays filled during the whole scroll.

type Item = { e: string; n: string; s: string; m: string };

const COPIES = 3;
const GAP = 12; // must match the track's gap-3 (0.75rem)

const NOW: Item[] = [
  { e: "🥤", n: "Cola", s: "e", m: "10.6g sugar" },
  { e: "🍫", n: "Chocolate Bar", s: "e", m: "NOVA 4" },
  { e: "🍪", n: "Sandwich Cookies", s: "e", m: "38g sugar" },
  { e: "🥔", n: "Potato Chips", s: "d", m: "535 kcal" },
  { e: "🥣", n: "Frosted Cereal", s: "e", m: "37g sugar" },
  { e: "🧃", n: "Juice Pouch", s: "d", m: "11g sugar" },
  { e: "🍩", n: "Glazed Donut", s: "e", m: "NOVA 4" },
  { e: "🍬", n: "Gummy Candy", s: "e", m: "46g sugar" },
];

const BETTER: Item[] = [
  { e: "💧", n: "Sparkling Water", s: "a", m: "0g sugar" },
  { e: "🍎", n: "Fresh Apple", s: "a", m: "NOVA 1" },
  { e: "🥜", n: "Almonds", s: "a", m: "21g protein" },
  { e: "🥛", n: "Oat Milk", s: "b", m: "NOVA 2" },
  { e: "🫐", n: "Blueberries", s: "a", m: "NOVA 1" },
  { e: "🥗", n: "Hummus", s: "a", m: "8g protein" },
  { e: "🍶", n: "Greek Yogurt", s: "a", m: "10g protein" },
  { e: "🍫", n: "85% Dark Choc", s: "b", m: "7g sugar" },
];

function Card({ item, tone }: { item: Item; tone: "now" | "better" }) {
  return (
    <div
      className={`relative flex items-center gap-3 rounded-2xl border bg-white/90 px-4 py-3 shadow-sm backdrop-blur transition-transform duration-200 hover:z-20 hover:scale-[1.07] hover:shadow-lg ${
        tone === "now" ? "border-accent/30" : "border-brand/30"
      }`}
    >
      <span className="text-2xl">{item.e}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-ink">{item.n}</div>
        <div className="truncate text-xs text-ink-soft">{item.m}</div>
      </div>
      <NutriScore grade={item.s} size={22} />
    </div>
  );
}

function Column({
  items,
  tone,
  trackRef,
}: {
  items: Item[];
  tone: "now" | "better";
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_11%,#000_89%,transparent)]">
      <div ref={trackRef} className="flex flex-col gap-3 will-change-transform">
        {Array.from({ length: COPIES }).flatMap((_, c) =>
          items.map((item, i) => <Card key={`${c}-${item.n}-${i}`} item={item} tone={tone} />),
        )}
      </div>
    </div>
  );
}

export function HeroMarquee() {
  const root = useRef<HTMLDivElement>(null);
  const nowTrack = useRef<HTMLDivElement>(null);
  const betterTrack = useRef<HTMLDivElement>(null);
  const badge = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // True per-copy height accounting for the inter-copy gap => seamless wrap.
      const copyHeight = (el: HTMLDivElement) => (el.scrollHeight + GAP) / COPIES;

      if (nowTrack.current) {
        gsap.to(nowTrack.current, {
          y: -copyHeight(nowTrack.current),
          duration: 26,
          ease: "none",
          repeat: -1,
        });
      }
      if (betterTrack.current) {
        const h = copyHeight(betterTrack.current);
        gsap.fromTo(
          betterTrack.current,
          { y: -h },
          { y: 0, duration: 30, ease: "none", repeat: -1 },
        );
      }

      gsap.to(badge.current, {
        y: -8,
        rotate: 6,
        duration: 2.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative grid h-full grid-cols-2 gap-3">
      <Column items={NOW} tone="now" trackRef={nowTrack} />
      <Column items={BETTER} tone="better" trackRef={betterTrack} />

      {/* center swap badge straddling both columns */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
        <div
          ref={badge}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-white shadow-2xl ring-4 ring-cream"
        >
          <span className="text-xl">🔄</span>
          <span className="text-sm font-extrabold tracking-tight">swap</span>
        </div>
      </div>
    </div>
  );
}
