import { addDays, weekday } from "./dates";
import type { Plan } from "./types";
import type { StrengthSlot } from "./training-types";
import { isQuality } from "./workouts";

export const STRENGTH_ROUTINES = { a: "runner-strength-a", b: "runner-strength-b", light: "hip-stability" } as const;

/**
 * Places strength sessions on days that leave the hard running intact: never on or the day
 * before the long run or a quality session, preferring rest days, and never on consecutive days.
 */
export function scheduleStrength(plan: Pick<Plan, "id" | "weeks" | "workouts">, perWeek: number, skipBefore?: string): StrengthSlot[] {
  if (perWeek <= 0) return [];
  const slots: StrengthSlot[] = [];
  let alternate = 0;

  for (const week of plan.weeks) {
    const isRaceWeek = plan.workouts.some((w) => w.week === week.index && w.type === "race");
    if (isRaceWeek) continue;
    const count = week.phase === "taper" ? Math.min(1, perWeek) : perWeek;
    const runs = plan.workouts.filter((w) => w.week === week.index);
    const hardDays = new Set(runs.filter((w) => w.type === "long" || isQuality(w.type)).map((w) => weekday(w.date)));
    const runDays = new Set(runs.map((w) => weekday(w.date)));

    const candidates = [0, 1, 2, 3, 4, 5, 6]
      .filter((d) => !hardDays.has(d) && !hardDays.has((d + 1) % 7))
      .map((d) => ({ d, score: runDays.has(d) ? 1 : 2 }))
      .sort((a, b) => b.score - a.score || a.d - b.d);

    const chosen: number[] = [];
    for (const { d } of candidates) {
      if (chosen.length >= count) break;
      if (chosen.some((c) => Math.abs(c - d) <= 1)) continue;
      chosen.push(d);
    }

    for (const d of chosen.sort((a, b) => a - b)) {
      const date = addDays(week.start, d);
      if (skipBefore && date < skipBefore) continue;
      const routineId = week.phase === "taper" ? STRENGTH_ROUTINES.light : alternate++ % 2 === 0 ? STRENGTH_ROUTINES.a : STRENGTH_ROUTINES.b;
      slots.push({ id: `${plan.id}-s${week.index}-${d}`, date, week: week.index, routineId, status: "planned" });
    }
  }
  return slots;
}
