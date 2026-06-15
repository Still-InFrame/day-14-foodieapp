import { isMissionKey, type MissionKey } from "./missions";

interface MissionStat {
  mission: MissionKey;
  count: number;
  sum: number; // total improvement in the mission's units
}

export interface DashboardData {
  total: number;
  thisWeek: number;
  weekly: { count: number }[]; // oldest -> newest, WEEKS buckets
  byMission: MissionStat[]; // sorted by count desc
  topMission: MissionKey | null;
}

interface SwapAggRow {
  mission: string;
  delta: number | null;
  created_at: string;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS = 8;

// Aggregate raw swap rows into everything the dashboard charts need.
export function computeDashboard(rows: SwapAggRow[], nowMs: number): DashboardData {
  const buckets = new Array<number>(WEEKS).fill(0);
  const byMission = new Map<MissionKey, MissionStat>();

  for (const r of rows) {
    const t = Date.parse(r.created_at);
    if (!Number.isNaN(t)) {
      const weeksAgo = Math.floor((nowMs - t) / WEEK_MS);
      if (weeksAgo >= 0 && weeksAgo < WEEKS) buckets[WEEKS - 1 - weeksAgo] += 1;
    }
    if (isMissionKey(r.mission)) {
      const s = byMission.get(r.mission) ?? { mission: r.mission, count: 0, sum: 0 };
      s.count += 1;
      s.sum += r.delta ?? 0;
      byMission.set(r.mission, s);
    }
  }

  const sorted = [...byMission.values()].sort((a, b) => b.count - a.count);
  return {
    total: rows.length,
    thisWeek: buckets[WEEKS - 1],
    weekly: buckets.map((count) => ({ count })),
    byMission: sorted,
    topMission: sorted[0]?.mission ?? null,
  };
}
