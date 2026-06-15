"use client";

import { useState } from "react";
import type { MissionKey } from "@/lib/missions";

// Shares a generated before/after PNG. Native share sheet where supported
// (mobile), download fallback otherwise (desktop). The image is self-published
// by the user, so this never exposes anything member-private.
export function ShareButton({
  original,
  swap,
  mission,
  delta,
}: {
  original: string;
  swap: string;
  mission: MissionKey;
  delta: number;
}) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  async function onShare() {
    setState("working");
    try {
      const url = `/api/share-card?o=${encodeURIComponent(original)}&s=${encodeURIComponent(
        swap,
      )}&m=${mission}&d=${delta}`;
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], "swapthis.png", { type: "image/png" });
      const data: ShareData = {
        title: "Swap This",
        text: `I swapped ${original} for ${swap} on Swap This`,
        files: [file],
      };

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share(data);
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "swapthis.png";
        link.click();
        URL.revokeObjectURL(link.href);
      }
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // User cancelled the share sheet, or generation failed — just reset.
      setState("idle");
    }
  }

  return (
    <button
      onClick={onShare}
      aria-label="Share this swap"
      title="Share this swap"
      className="flex shrink-0 items-center justify-center rounded-full border border-cream-deep px-3 py-2 text-sm font-bold text-ink-soft transition hover:border-brand hover:text-brand"
    >
      {state === "working" ? "…" : state === "done" ? "✓" : "Share"}
    </button>
  );
}
