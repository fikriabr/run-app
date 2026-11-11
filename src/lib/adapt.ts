import { addDays, daysBetween, mondayOf } from "./dates";
import type { Activity, FitnessChange, GoalKind, Plan, Workout } from "./types";
import { clampVdot, zonePace } from "./vdot";
import { EXPECTED_RPE, isQuality } from "./workouts";

export interface Adjustment {
  delta: number;
  reason: FitnessChange["reason"];
}

/**
 * Decides whether a completed workout should move the runner's fitness estimate.
 * Effort that is far off what the session should feel like nudges all future paces.
 */
export function assessWorkout(
  workout: Workout,
  activity: Activity,
  rpe: number,
  vdot: number,
  goal: GoalKind,
): Adjustment | null {
  const expected = EXPECTED_RPE[workout.type];
  const diff = rpe - expected;
  if (diff >= 3) return { delta: -1, reason: "harder" };
  if (diff >= 2) return { delta: -0.5, reason: "harder" };
  if (!isQuality(workout.type) || workout.type === "race") return null;

  // Average pace across the work steps against the faster end of their target band.
  let ratioSum = 0;
  let count = 0;
  for (const result of activity.stepResults ?? []) {
    const step = workout.steps[result.index];
    if (!step || step.kind !== "work" || !step.zone || result.distance < 200) continue;
    const pace = result.duration / (result.distance / 1000);
    ratioSum += pace / zonePace(vdot, step.zone, goal).fast;
    count++;
  }
  const ratio = count > 0 ? ratioSum / count : null;
  if (ratio != null && ratio < 0.98 && diff <= 0) return { delta: 0.5, reason: "fasterThanTarget" };
  if (diff <= -2) return { delta: 0.5, reason: "easier" };
  return null;
}

export function applyAdjustment(vdot: number, adjustment: Adjustment): number {
  return clampVdot(Math.round((vdot + adjustment.delta) * 10) / 10);
}

/** Planned workouts from the last 14 days that were neither run nor skipped on purpose. */
export function missedWorkouts(plan: Plan, today: string): Workout[] {
  return plan.workouts.filter((w) => w.status === "planned" && w.date < today && daysBetween(w.date, today) <= 14);
}

/** Moves a workout to a new date within its week, swapping with a workout already on that date. */
export function moveWorkout(plan: Plan, workoutId: string, newDate: string): Plan {
  const moving = plan.workouts.find((w) => w.id === workoutId);
  if (!moving) return plan;
  const weekStart = mondayOf(moving.date);
  if (newDate < weekStart || newDate > addDays(weekStart, 6)) return plan;
  const occupant = plan.workouts.find((w) => w.date === newDate && w.id !== workoutId);
  const workouts = plan.workouts
    .map((w) => {
      if (w.id === workoutId) return { ...w, date: newDate };
      if (occupant && w.id === occupant.id) return { ...w, date: moving.date };
      return w;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return { ...plan, workouts };
}

/** Picks the planned workout a free run most likely fulfils: today's, if it is still open. */
export function matchWorkout(plan: Plan | null, date: string): Workout | undefined {
  return plan?.workouts.find((w) => w.date === date && w.status === "planned");
}
