"use client";

import { useEffect, useState } from "react";

// Lightweight, no-account, no-Google anti-bot check. Three layers:
//  1. Honeypot — an off-screen field humans never see; bots that fill every
//     input trip it.
//  2. A small arithmetic challenge — requires a human to read + answer.
//  3. A timing guard — stays invalid for the first ~1.2s so instant auto-fills
//     can't pass.
// Reports overall validity via onValidChange; the form gates submit on it.

const rnd = () => 1 + Math.floor(Math.random() * 8);

export function HumanCheck({ onValidChange }: { onValidChange: (valid: boolean) => void }) {
  const [a] = useState(rnd);
  const [b] = useState(rnd);
  const [answer, setAnswer] = useState("");
  const [trap, setTrap] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const correct = answer.trim() !== "" && Number(answer) === a + b;

  useEffect(() => {
    onValidChange(correct && trap === "" && ready);
  }, [correct, trap, ready, onValidChange]);

  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium text-ink">
      {/* Honeypot — hidden from humans, irresistible to dumb bots */}
      <input
        type="text"
        name="homepage"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <span>
        Quick check — what&apos;s {a} + {b}?
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type the answer"
        aria-label={`What is ${a} plus ${b}?`}
        className={`rounded-xl border bg-cream/40 px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-brand/20 ${
          correct ? "border-brand" : "border-cream-deep focus:border-brand"
        }`}
      />
    </div>
  );
}
