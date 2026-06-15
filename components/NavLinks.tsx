"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/app", label: "Swap" },
  { href: "/app/impact", label: "Impact" },
  { href: "/app/discover", label: "Discover" },
  { href: "/app/profile", label: "Profile" },
];

// Active when the path matches exactly for "/app", or starts with the href otherwise.
export function isNavActive(pathname: string, href: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm font-semibold">
      {NAV_LINKS.map((l) => {
        const active = isNavActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-3 py-1.5 transition ${
              active ? "bg-brand-tint text-brand-dark" : "text-ink-soft hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
