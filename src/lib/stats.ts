import { addDays, mondayOf, toDateKey } from "./dates";
import { haversine } from "./geo";
import type { Activity, EffortKey, RoutePoint } from "./types";

export const EFFORT_DISTANCES: Record<EffortKey, number> = {
  "1k": 1000,
  "1mi": 1609.344,
  "5k": 5000,
  "10k": 10000,
  half: 21097.5,
  marathon: 42195,
};

/**
 * Fastest time over each standard distance inside one run, found with a two-pointer
 * sweep over cumulative distance. Times are interpolated at the window start.
 */
export function bestEfforts(points: RoutePoint[]): Partial<Record<EffortKey, number>> {
  if (points.length < 2) return {};
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + haversine(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]));
  }
  const total = cum[cum.length - 1];
  const result: Partial<Record<EffortKey, number>> = {};
  for (const [key, target] of Object.entries(EFFORT_DISTANCES) as [EffortKey, number][]) {
    // Half a metre of slack absorbs float error, as in the run engine.
    const need = target - 0.5;
    if (total < need) continue;
    let best = Infinity;
    let start = 0;
    for (let end = 1; end < points.length; end++) {
      while (start < end && cum[end] - cum[start + 1] >= need) start++;
      const covered = cum[end] - cum[start];
      if (covered < need) continue;
      // Shift the window start forward so it covers exactly `target` metres.
      const excess = Math.max(0, covered - target);
      const segLen = cum[start + 1] - cum[start];
      const frac = segLen > 0 ? excess / segLen : 0;
      const startTime = points[start][2] + frac * (points[start + 1][2] - points[start][2]);
      best = Math.min(best, (points[end][2] - startTime) / 1000);
    }
    if (Number.isFinite(best)) result[key] = best;
  }
  return result;
}

export interface WeekTotal {
  start: string;
  distance: number;
  duration: number;
  runs: number;
}

/** Totals for the last `count` calendar weeks (Monday start), oldest first, including empty weeks. */
export function weeklyTotals(activities: Activity[], count: number, now: Date = new Date()): WeekTotal[] {
  const thisMonday = mondayOf(toDateKey(now));
  const weeks: WeekTotal[] = [];
  for (let i = count - 1; i >= 0; i--) {
    weeks.push({ start: addDays(thisMonday, -7 * i), distance: 0, duration: 0, runs: 0 });
  }
  const index = new Map(weeks.map((w, i) => [w.start, i]));
  for (const a of activities) {
    const i = index.get(mondayOf(toDateKey(new Date(a.startedAt))));
    if (i == null) continue;
    weeks[i].distance += a.distance;
    weeks[i].duration += a.duration;
    weeks[i].runs += 1;
  }
  return weeks;
}

export interface PersonalBest {
  key: EffortKey;
  seconds: number;
  activityId: string;
  at: number;
}

export function personalBests(activities: Activity[]): PersonalBest[] {
  const best = new Map<EffortKey, PersonalBest>();
  for (const a of activities) {
    for (const [key, seconds] of Object.entries(a.bestEfforts ?? {}) as [EffortKey, number][]) {
      const current = best.get(key);
      if (!current || seconds < current.seconds) best.set(key, { key, seconds, activityId: a.id, at: a.startedAt });
    }
  }
  return (Object.keys(EFFORT_DISTANCES) as EffortKey[]).flatMap((k) => (best.has(k) ? [best.get(k)!] : []));
}

/** Consecutive weeks, ending this week or last week, that contain at least one run. */
export function weekStreak(activities: Activity[], now: Date = new Date()): number {
  const weeks = weeklyTotals(activities, 104, now);
  let i = weeks.length - 1;
  if (weeks[i].runs === 0) i--;
  let streak = 0;
  for (; i >= 0 && weeks[i].runs > 0; i--) streak++;
  return streak;
}
