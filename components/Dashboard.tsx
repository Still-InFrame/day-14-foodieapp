import Link from "next/link";
import { MISSIONS, type MissionKey } from "@/lib/missions";
import { fmtDelta } from "@/lib/format";
import type { DashboardData } from "@/lib/dashboard";

// Distinct colors per goal for the donut/legend.
const MCOLOR: Record<MissionKey, string> = {
  calories: "#f4763b",
  sugar: "#e85d9e",
  nova: "#a87b4f",
  salt: "#7a8aa0",
  protein: "#3b82f6",
  eco: "#1f9d57",
};

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-cream-deep bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-ink">{value}</div>
      {sub && <div className="text-sm text-ink-soft">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cream-deep bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}

// Swaps-per-week bar chart (oldest -> newest; this week emphasized).
function BarChart({ data }: { data: { count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const W = 280;
  const H = 130;
  const pad = 16;
  const n = data.length;
  const slot = (W - pad * 2) / n;
  const bw = slot * 0.55;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Swaps per week">
      {data.map((d, i) => {
        const x = pad + slot * i + (slot - bw) / 2;
        const h = (d.count / max) * (H - 44);
        const y = H - 24 - h;
        const last = i === n - 1;
        return (
          <g key={i}>
            {d.count > 0 && (
              <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-ink)">
                {d.count}
              </text>
            )}
            <rect
              x={x}
              y={d.count > 0 ? y : H - 26}
              width={bw}
              height={d.count > 0 ? h : 2}
              rx={3}
              fill={last ? "var(--color-brand-dark)" : "var(--color-brand)"}
              opacity={d.count === 0 ? 0.18 : 1}
            />
          </g>
        );
      })}
      <line x1={pad} y1={H - 24} x2={W - pad} y2={H - 24} stroke="var(--color-cream-deep)" strokeWidth="1" />
      <text x={pad} y={H - 8} fontSize="9" fill="var(--color-ink-soft)">
        8 wks ago
      </text>
      <text x={W - pad} y={H - 8} fontSize="9" textAnchor="end" fill="var(--color-ink-soft)">
        now
      </text>
    </svg>
  );
}

// By-goal donut + legend.
function Donut({ data }: { data: DashboardData }) {
  const R = 15.9155; // circumference = 100, so values map directly to %
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r={R} fill="none" stroke="var(--color-cream-deep)" strokeWidth="4" />
          {data.byMission.map((m) => {
            const pct = data.total ? (m.count / data.total) * 100 : 0;
            const el = (
              <circle
                key={m.mission}
                cx="18"
                cy="18"
                r={R}
                fill="none"
                stroke={MCOLOR[m.mission]}
                strokeWidth="4"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={-offset}
              />
            );
            offset += pct;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-ink">{data.total}</span>
          <span className="text-[0.65rem] text-ink-soft">swaps</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        {data.byMission.map((m) => (
          <div key={m.mission} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: MCOLOR[m.mission] }} />
            <span className="text-ink-soft">
              {MISSIONS[m.mission].emoji} {MISSIONS[m.mission].short}
            </span>
            <span className="font-bold text-ink">{m.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard({ data }: { data: DashboardData }) {
  if (data.total === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-cream-deep bg-white p-10 text-center">
        <div className="text-4xl">📊</div>
        <p className="mt-3 font-bold text-ink">Your dashboard is waiting</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
          Search a product above and accept a better pick — your swaps, streak, and impact will chart
          out right here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">At a glance</h2>
        <Link href="/app/impact" className="text-sm font-semibold text-brand-dark hover:underline">
          Full impact →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Tile label="Total swaps" value={data.total} />
        <Tile label="This week" value={data.thisWeek} />
        <Tile
          label="Top goal"
          value={data.topMission ? MISSIONS[data.topMission].emoji : "—"}
          sub={data.topMission ? MISSIONS[data.topMission].label : undefined}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Swaps over time">
          <BarChart data={data.weekly} />
        </ChartCard>
        <ChartCard title="By goal">
          <Donut data={data} />
        </ChartCard>
      </div>

      <div className="flex flex-wrap gap-2">
        {data.byMission.map((m) => (
          <span
            key={m.mission}
            className="rounded-full bg-brand-tint px-3 py-1.5 text-sm font-bold text-brand-dark"
          >
            {MISSIONS[m.mission].emoji} {fmtDelta(m.mission, m.sum)} {MISSIONS[m.mission].short.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
