"use client";

import { useState } from "react";
import { MISSION_LIST, type MissionKey } from "@/lib/missions";
import { COUNTRIES } from "@/lib/countries";

interface ProfileForm {
  handle: string;
  display_name: string;
  default_mission: MissionKey;
  is_public: boolean;
  country: string;
}

export function ProfileSettings({ initial }: { initial: ProfileForm }) {
  const [form, setForm] = useState<ProfileForm>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setMsg(null);
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error ?? "Couldn't save." });
      } else {
        setForm((f) => ({ ...f, ...data.profile, handle: data.profile.handle ?? "" }));
        setMsg({ kind: "ok", text: "Saved." });
      }
    } catch {
      setMsg({ kind: "err", text: "Couldn't save — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-cream-deep bg-white p-6">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Display name
        <input
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          placeholder="What others see"
          className="rounded-xl border border-cream-deep bg-cream/40 px-4 py-2.5 text-base font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Handle
        <div className="flex items-center rounded-xl border border-cream-deep bg-cream/40 px-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <span className="text-ink-soft">/u/</span>
          <input
            value={form.handle}
            onChange={(e) => set("handle", e.target.value)}
            placeholder="yourname"
            className="flex-1 bg-transparent py-2.5 text-base font-normal outline-none"
          />
        </div>
        <span className="text-xs font-normal text-ink-soft">
          3–20 chars: letters, numbers, underscores. Your public profile lives here.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Default goal
        <select
          value={form.default_mission}
          onChange={(e) => set("default_mission", e.target.value as MissionKey)}
          className="rounded-xl border border-cream-deep bg-cream/40 px-4 py-2.5 text-base font-normal outline-none focus:border-brand"
        >
          {MISSION_LIST.map((m) => (
            <option key={m.key} value={m.key}>
              {m.emoji} {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Country
        <select
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
          className="rounded-xl border border-cream-deep bg-cream/40 px-4 py-2.5 text-base font-normal outline-none focus:border-brand"
        >
          {COUNTRIES.map((c) => (
            <option key={c.slug || "world"} value={c.slug}>
              {c.flag} {c.label}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-ink-soft">
          We&apos;ll suggest swaps sold here — so results are in your language and on your shelves.
        </span>
      </label>

      <label className="flex items-center justify-between gap-4 rounded-xl bg-cream/40 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-ink">Public profile</span>
          <span className="block text-xs text-ink-soft">
            Let other members see your swaps and impact.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={form.is_public}
          onClick={() => set("is_public", !form.is_public)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            form.is_public ? "bg-brand" : "bg-cream-deep"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
              form.is_public ? "left-6" : "left-1"
            }`}
          />
        </button>
      </label>

      {msg && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.kind === "ok" ? "bg-brand-tint text-brand-dark" : "bg-grade-e/10 text-grade-e"
          }`}
        >
          {msg.text}
        </p>
      )}

      <button
        onClick={save}
        disabled={busy}
        className="rounded-full bg-brand py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
