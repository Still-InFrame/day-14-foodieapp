"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Logo } from "@/components/Logo";
import { HeroMarquee } from "@/components/landing/HeroMarquee";
import { MISSION_LIST } from "@/lib/missions";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Interactive "pick a mission" demo data — representative real swaps.
const DEMO = [
  { key: "calories", emoji: "🔥", label: "calories", from: "Doritos", fromVal: "535 kcal", to: "Baked Tortilla Chips", toVal: "445 kcal", delta: "−90 kcal" },
  { key: "sugar", emoji: "🍬", label: "sugar", from: "Coca-Cola", fromVal: "10.6 g", to: "Coca-Cola Zero", toVal: "0 g", delta: "−10.6 g" },
  { key: "nova", emoji: "🏭", label: "processing", from: "Instant Noodles", fromVal: "NOVA 4", to: "Whole-Grain Pasta", toVal: "NOVA 2", delta: "−2 NOVA" },
  { key: "protein", emoji: "💪", label: "protein", from: "Snickers", fromVal: "8 g", to: "Barebells Bar", toVal: "20 g", delta: "+12 g" },
  { key: "eco", emoji: "🌍", label: "eco-impact", from: "Beef Burger", fromVal: "low", to: "Plant Burger", toVal: "high", delta: "+55 pts" },
];

// A feature section: copy on one side, an app-screen mockup on the other.
function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  image,
  alt,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  image: string;
  alt: string;
  reverse?: boolean;
}) {
  return (
    <div className="reveal-group grid items-center gap-10 md:grid-cols-2">
      <div className={reverse ? "md:order-2" : ""}>
        <div className="reveal">
          <span className="inline-block rounded-full bg-brand-tint px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">
            {eyebrow}
          </span>
          <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h3>
          <p className="mt-3 text-ink-soft">{body}</p>
          <ul className="mt-5 space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 font-medium text-ink">
                <span className="font-bold text-brand">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`reveal ${reverse ? "md:order-1" : ""}`}>
        <div className="mx-auto max-w-[18rem] rounded-[2rem] bg-gradient-to-br from-brand-tint to-accent-tint p-4 shadow-xl">
          <Image
            src={image}
            alt={alt}
            width={512}
            height={768}
            className="w-full rounded-[1.4rem] shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

export function LandingClient({ totalSwaps, loggedIn }: { totalSwaps: number; loggedIn: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [demo, setDemo] = useState(0);
  const primaryHref = loggedIn ? "/app" : "/login";
  const active = DEMO[demo];

  useGSAP(
    () => {
      // Hero entrance
      gsap.from(".hero-stagger", {
        y: 32,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
      });
      gsap.from(".hero-art", {
        scale: 0.85,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.2,
      });

      // Count-up counter
      if (totalSwaps > 0 && counterRef.current) {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: totalSwaps,
          duration: 2,
          ease: "power2.out",
          delay: 0.5,
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = Math.round(obj.v).toLocaleString();
            }
          },
        });
      }

      // Immersive pinned zoom section
      gsap.fromTo(
        ".zoom-img",
        { scale: 1.05 },
        {
          scale: 1.6,
          ease: "none",
          scrollTrigger: {
            trigger: ".zoom-section",
            start: "top top",
            end: "+=120%",
            scrub: true,
            pin: true,
          },
        },
      );
      gsap.fromTo(
        ".zoom-text",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: { trigger: ".zoom-section", start: "top 60%", end: "top 20%", scrub: true },
        },
      );

      // Scroll-reveal groups via IntersectionObserver. ScrollTrigger's position
      // math gets thrown off by the PINNED zoom section's spacer + late-loading
      // images, which left lower groups (e.g. the mission cards) stuck hidden. IO
      // is immune to that — it reveals purely on actual viewport intersection.
      const groups = gsap.utils.toArray<HTMLElement>(".reveal-group");
      groups.forEach((g) => gsap.set(g.querySelectorAll(".reveal"), { opacity: 0, y: 44 }));
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            gsap.to(entry.target.querySelectorAll(".reveal"), {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              stagger: 0.1,
            });
            io.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
      );
      groups.forEach((g) => io.observe(g));

      // Parallax on the scan image
      gsap.to(".parallax-scan", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: ".scan-section", start: "top bottom", end: "bottom top", scrub: true },
      });

      // Late-loading images shift the layout after the pin/parallax triggers are
      // measured — refresh as images load + a few delayed passes to stay correct.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      root.current?.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", refresh, { once: true });
      });
      const timers = [400, 1200, 2500].map((d) => window.setTimeout(refresh, d));
      return () => {
        io.disconnect();
        window.removeEventListener("load", refresh);
        timers.forEach((id) => window.clearTimeout(id));
      };
    },
    { scope: root },
  );

  // Animate the interactive demo card whenever the mission changes.
  useGSAP(
    () => {
      if (!demoRef.current) return;
      gsap.fromTo(
        demoRef.current.querySelectorAll(".demo-anim"),
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.06 },
      );
    },
    { dependencies: [demo], scope: demoRef },
  );

  return (
    <div ref={root} className="overflow-x-hidden bg-cream">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-cream-deep/60 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Logo size={30} />
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link href="/login" className="rounded-full px-4 py-2 text-ink-soft hover:text-ink">
              Sign in
            </Link>
            <Link
              href={primaryHref}
              className="rounded-full bg-brand px-4 py-2 text-white transition hover:bg-brand-dark"
            >
              {loggedIn ? "Open app" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — story on the left, live "now vs. swap to" marquee on the right */}
      <section className="bg-grain">
        <div className="mx-auto grid min-h-[100svh] w-full max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
          <div>
            <span className="hero-stagger inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand-dark">
              🥗 Healthier swaps for the food you already eat
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.03] tracking-tight text-ink md:text-6xl">
              <span className="hero-stagger block">Keep the cravings.</span>
              <span className="hero-stagger block">
                Cut the <span className="text-brand">junk.</span>
              </span>
            </h1>
            <p className="hero-stagger mt-5 max-w-md text-lg text-ink-soft">
              Search any product and <span className="font-semibold text-ink">Swap This</span>{" "}
              finds a healthier version in the same aisle — same taste, better stats. You decide
              what &quot;better&quot; means.
            </p>
            <ul className="hero-stagger mt-5 flex flex-col gap-2 text-[0.95rem] font-medium text-ink">
              <li className="flex items-center gap-2">
                <span className="font-bold text-brand">✓</span> Same cravings, better stats — no lectures
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-brand">✓</span> Real products you can actually buy
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-brand">✓</span> Your goal: less sugar, calories, or processing
              </li>
            </ul>
            <div className="hero-stagger mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="rounded-full bg-brand px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                {loggedIn ? "Open the app" : "Start swapping — free"}
              </Link>
              <Link
                href="#how"
                className="rounded-full border border-cream-deep px-6 py-3.5 text-base font-semibold text-ink transition hover:bg-white"
              >
                See how it works
              </Link>
            </div>
            <div className="hero-stagger mt-9 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-tint text-2xl">
                🔁
              </div>
              <div>
                <div className="text-2xl font-extrabold text-ink">
                  {totalSwaps > 0 ? <span ref={counterRef}>0</span> : "Be the first"}
                </div>
                <div className="text-sm text-ink-soft">
                  {totalSwaps > 0
                    ? `swap${totalSwaps === 1 ? "" : "s"} made and counting`
                    : "to make a swap"}
                </div>
              </div>
            </div>
          </div>

          <div className="hero-art flex h-[60vh] flex-col md:h-[84vh]">
            <div className="mb-3 grid grid-cols-2 gap-3 text-center text-[0.7rem] font-extrabold uppercase tracking-wider">
              <span className="text-accent">Eating now</span>
              <span className="text-brand">Swap to ✓</span>
            </div>
            <div className="min-h-0 flex-1">
              <HeroMarquee />
            </div>
          </div>
        </div>
      </section>

      {/* Immersive scroll-zoom */}
      <section className="zoom-section relative h-screen overflow-hidden">
        <div
          className="zoom-img absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: "url(/zoom-spread.png)" }}
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="zoom-text relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center text-white">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Real food. Real data.
            <br />
            Real <span className="text-brand-tint">upgrades.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Every swap is a genuine product from the world&apos;s largest open food database — scored
            on what actually matters to you.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="reveal-group mx-auto w-full max-w-6xl px-5 py-20">
        <h2 className="reveal text-center text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Three taps to a better cart
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", t: "Find your food", d: "Search any product by name, or scan its barcode. We pull its real nutrition instantly." },
            { n: "2", t: "Pick your mission", d: "Cutting calories? Sugar? Processing? Flip the toggle and the swaps re-rank live." },
            { n: "3", t: "Make the swap", d: "Get better same-category picks, accept the ones you like, and track the impact." },
          ].map((s) => (
            <div key={s.n} className="reveal rounded-3xl border border-cream-deep bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-ink-soft">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive mission demo */}
      <section className="bg-white py-20">
        <div className="reveal-group mx-auto grid w-full max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
          <div className="reveal">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              Swap for whatever <span className="text-brand">you</span> care about
            </h2>
            <p className="mt-3 text-ink-soft">
              Tap a goal — the same idea, re-ranked live. This is exactly how the app feels.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {DEMO.map((d, i) => (
                <button
                  key={d.key}
                  onClick={() => setDemo(i)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    demo === i
                      ? "bg-brand text-white shadow-sm"
                      : "border border-cream-deep bg-white text-ink-soft hover:text-ink"
                  }`}
                >
                  <span className="mr-1">{d.emoji}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={demoRef} className="reveal rounded-3xl border border-cream-deep bg-cream/50 p-6 shadow-sm">
            <div className="demo-anim text-xs font-bold uppercase tracking-wide text-ink-soft">
              Optimizing for {active.emoji} {active.label}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="demo-anim flex-1 rounded-2xl border border-accent/30 bg-accent-tint/40 p-4">
                <div className="text-xs font-bold uppercase text-accent">Now</div>
                <div className="mt-1 font-extrabold text-ink">{active.from}</div>
                <div className="text-sm text-ink-soft">{active.fromVal}</div>
              </div>
              <div className="demo-anim text-2xl font-extrabold text-brand">→</div>
              <div className="demo-anim flex-1 rounded-2xl border border-brand/30 bg-brand-tint/60 p-4">
                <div className="text-xs font-bold uppercase text-brand-dark">Swap</div>
                <div className="mt-1 font-extrabold text-ink">{active.to}</div>
                <div className="text-sm text-ink-soft">{active.toVal}</div>
              </div>
            </div>
            <div className="demo-anim mt-4 flex justify-center">
              <span className="rounded-full bg-brand px-5 py-2 text-lg font-extrabold text-white">
                {active.delta}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature showcase with app mockups */}
      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="reveal-group mb-16 text-center">
            <h2 className="reveal text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              Everything you need to swap smarter
            </h2>
            <p className="reveal mx-auto mt-3 max-w-xl text-ink-soft">
              Find it, understand it, and watch it add up — from the aisle to your kitchen.
            </p>
          </div>
          <div className="flex flex-col gap-20">
            <FeatureRow
              eyebrow="Instant swaps"
              title="Better picks in seconds"
              body="Search any product and get same-category alternatives ranked for your goal — each with the exact win, like −92 calories or −10g sugar."
              bullets={["Live goal toggle re-ranks instantly", "Real products you can actually buy", "One tap to save the swap"]}
              image="/mockup-swap.png"
              alt="App screen showing a product and three better swap suggestions"
            />
            <FeatureRow
              eyebrow="Full transparency"
              title="Know what's really inside"
              body="Tap any product for the full breakdown — nutrition, Nutri-Score, processing level, additives and allergens — all in plain language."
              bullets={["NOVA processing level explained", "Additives & allergens flagged", "Before-vs-after comparison"]}
              image="/mockup-detail.png"
              alt="App screen showing a product profile with scores and nutrition"
              reverse
            />
            <FeatureRow
              eyebrow="Stay motivated"
              title="Watch your impact add up"
              body="Every swap charts onto your dashboard — sugar cut, calories saved, weeks on a streak — so your progress is impossible to miss."
              bullets={["Swaps-over-time chart", "Impact broken down by goal", "Share your wins with members"]}
              image="/mockup-dashboard.png"
              alt="App screen showing an impact dashboard with charts"
            />
          </div>
        </div>
      </section>

      {/* Scan section with parallax image */}
      <section className="scan-section reveal-group overflow-hidden bg-cream">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div className="reveal order-2 md:order-1">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              Scan it in the aisle
            </h2>
            <p className="mt-3 max-w-md text-ink-soft">
              Point your camera at any barcode and get an instant verdict plus better picks — right
              there while you shop. No typing required.
            </p>
            <ul className="mt-5 space-y-2 text-ink">
              {["Instant nutrition + Nutri-Score", "Better swaps in the same category", "Save it to your impact"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-brand">✓</span>
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="reveal order-1 md:order-2">
            <div className="relative mx-auto aspect-[2/3] max-w-xs overflow-hidden rounded-[2rem] shadow-2xl">
              <Image
                src="/scan-demo.png"
                alt="Scanning a grocery product barcode with a phone"
                fill
                sizes="(max-width: 768px) 80vw, 320px"
                className="parallax-scan scale-125 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Missions grid */}
      <section className="reveal-group bg-white py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="reveal text-center text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Six goals, one tap away
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {MISSION_LIST.map((m) => (
              <div key={m.key} className="reveal rounded-2xl border border-cream-deep bg-cream/50 p-5 text-center transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl">{m.emoji}</div>
                <div className="mt-2 font-bold text-ink">{m.label}</div>
                <div className="mt-1 text-sm text-ink-soft">{m.blurb}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="reveal-group mx-auto w-full max-w-6xl px-5 py-24">
        <div className="reveal rounded-[2.5rem] bg-brand px-8 py-16 text-center text-white shadow-xl">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Your next grocery run, upgraded.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/85">
            Join the swappers cutting sugar, calories, and processing — one smarter pick at a time.
          </p>
          <Link
            href={primaryHref}
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-base font-bold text-brand-dark transition hover:-translate-y-0.5 hover:bg-cream"
          >
            {loggedIn ? "Open the app" : "Create your free account"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-cream-deep py-8 text-center text-sm text-ink-soft">
        <p>
          Food data from{" "}
          <a className="underline" href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
            Open Food Facts
          </a>{" "}
          · Day 14 of Savion&apos;s 100 Day AI Build Challenge
        </p>
      </footer>
    </div>
  );
}
