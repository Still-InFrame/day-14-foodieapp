"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { HumanCheck } from "@/components/HumanCheck";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [human, setHuman] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!human) {
      setError("Please complete the quick check below.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push(next);
        router.refresh();
        return;
      } else {
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(next);
        router.refresh();
        return;
      }
    }
    setBusy(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Link href="/">
          <Logo size={40} />
        </Link>
        <p className="text-sm text-ink-soft">
          {mode === "signin"
            ? "Welcome back. Sign in to keep swapping."
            : "Create an account and start upgrading your cart."}
        </p>
      </div>

      <div className="rounded-3xl border border-cream-deep bg-white p-7 shadow-sm">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-cream-deep p-1 text-sm font-semibold">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
              }}
              className={`rounded-full py-2 transition ${
                mode === m ? "bg-white text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-cream-deep bg-cream/40 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-cream-deep bg-cream/40 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="At least 6 characters"
            />
          </label>

          <HumanCheck onValidChange={setHuman} />

          {error && (
            <p className="rounded-lg bg-grade-e/10 px-3 py-2 text-sm text-grade-e">{error}</p>
          )}
          {info && (
            <p className="rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-dark">{info}</p>
          )}

          <button
            type="submit"
            disabled={busy || !human}
            className="mt-1 rounded-full bg-brand py-3 text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "One sec…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-xs text-ink-soft">
          <span className="h-px flex-1 bg-cream-deep" />
          more ways soon
          <span className="h-px flex-1 bg-cream-deep" />
        </div>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="mt-3 w-full cursor-not-allowed rounded-full border border-cream-deep bg-cream/40 py-3 text-sm font-semibold text-ink-soft"
        >
          Continue with Google · soon
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Food data from{" "}
        <a className="underline" href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
          Open Food Facts
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-grain px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
