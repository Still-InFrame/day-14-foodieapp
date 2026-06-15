import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ensureProfile } from "@/lib/profile";
import { NavLinks } from "@/components/NavLinks";
import { MobileNav } from "@/components/MobileNav";

// Shell for the members-only app. Middleware guarantees a session here; we also
// bootstrap the user's profile row on first visit.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-cream-deep bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/app" className="shrink-0">
            <Logo />
          </Link>
          {/* Desktop: inline nav + sign out */}
          <div className="hidden items-center gap-4 md:flex">
            <NavLinks />
            <form action="/auth/signout" method="post">
              <button className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
          {/* Mobile: hamburger drawer */}
          <MobileNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
