"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Logo } from "@/components/Logo";
import { NAV_LINKS, isNavActive } from "@/components/NavLinks";

// Mobile-only hamburger + slide-in drawer. `open` is the single source of truth:
// it mounts the drawer AND triggers the entrance (which plays immediately on
// mount — no fragile paused/play handoff). Closing animates out, then unmounts
// in the tween's onComplete so the exit is just as smooth.
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!open || !panel.current) return;
      gsap
        .timeline()
        .set(backdrop.current, { autoAlpha: 0 })
        .to(backdrop.current, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })
        .fromTo(
          panel.current,
          { xPercent: 100 },
          { xPercent: 0, duration: 0.45, ease: "power3.out" },
          "<",
        )
        .fromTo(
          panel.current.querySelector(".menu-content"),
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" },
          "-=0.22",
        );
    },
    { scope: root, dependencies: [open] },
  );

  function close() {
    if (!panel.current || !backdrop.current) {
      setOpen(false);
      return;
    }
    gsap.to(panel.current, { xPercent: 100, duration: 0.35, ease: "power2.in" });
    gsap.to(backdrop.current, {
      autoAlpha: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => setOpen(false),
    });
  }

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={root} className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-cream-deep/60"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Portal to <body> so the fixed overlay escapes the header's
          backdrop-filter containing block (which would otherwise trap it). */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              ref={backdrop}
              onClick={close}
              className="absolute inset-0 bg-ink/40 opacity-0 backdrop-blur-sm"
            />
          <div
            ref={panel}
            className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-cream p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <Logo size={28} />
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-deep/60 hover:text-ink"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="menu-content mt-10 flex flex-1 flex-col">
              <nav className="flex flex-col gap-1.5">
                {NAV_LINKS.map((l) => {
                  const active = isNavActive(pathname, l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={close}
                      className={`rounded-2xl px-4 py-3 text-lg font-bold transition ${
                        active ? "bg-brand-tint text-brand-dark" : "text-ink hover:bg-cream-deep/50"
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </nav>

              <form action="/auth/signout" method="post" className="mt-auto">
                <button className="w-full rounded-full border border-cream-deep py-3 text-sm font-bold text-ink-soft transition hover:text-ink">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
