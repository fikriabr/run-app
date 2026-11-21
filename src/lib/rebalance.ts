import { addDays, fromDateKey, toDateKey } from "./dates";
import type { Activity, GoalKind, Plan, Workout, WorkoutType } from "./types";
import { stepPace, workoutDistance } from "./workouts";

/** Run types whose distance can grow or shrink without changing what the session is for. */
const FLEXIBLE: WorkoutType[] = ["easy", "recovery", "long"];

// A single run never grows by more than this, so a short week is not crammed into the next few days.
const MAX_GROW_SHARE = 0.25;
const MAX_GROW_METERS = 2000;
const MIN_SHRINK_SHARE = 0.7;
const MIN_RUN_METERS = 3000;
/** Gaps smaller than this are noise from rounding and GPS. */
export const MIN_GAP_METERS = 500;

export interface WeekBalance {
  /** The week as planned: every run that was not skipped, at its size before any recalculation. */
  target: number;
  /** Distance already run this week: recorded or logged runs, plus completed runs with no activity at their planned size. */
  done: number;
  /** Distance of planned runs still ahead (today included). */
  ahead: number;
  /** target - done - ahead. Positive means the week is short, negative means it is over. */
  gap: number;
}

export interface RunChange {
  workoutId: string;
  date: string;
  type: WorkoutType;
  from: number;
  to: number;
}

export interface Rebalance {
  balance: WeekBalance;
  changes: RunChange[];
  /** Part of the gap left out on purpose because the remaining runs could not take it safely. */
  dropped: number;
  plan: Plan;
}

function originalDistance(w: Workout, vdot: number, goal: GoalKind): number {
  return w.plannedDistance ?? workoutDistance(w, vdot, goal);
}

function dateOf(ms: number): string {
  return toDateKey(new Date(ms));
}

export function weekBalance(plan: Plan, weekIndex: number, activities: Activity[], vdot: number, today: string): WeekBalance | null {
  const week = plan.weeks.find((w) => w.index === weekIndex);
  if (!week) return null;
  const goal = plan.input.goal;
  const end = addDays(week.start, 6);
  const workouts = plan.workouts.filter((w) => w.week === weekIndex);
  const byId = new Map(activities.map((a) => [a.id, a]));

  let done = 0;
  for (const w of workouts) {
    if (w.status !== "completed") continue;
    const activity = w.activityId ? byId.get(w.activityId) : undefined;
    done += activity ? activity.distance : workoutDistance(w, vdot, goal);
  }
  // Free runs that week count too: they were still kilometres in the legs.
  for (const a of activities) {
    const day = dateOf(a.startedAt);
    if (day >= week.start && day <= end && !workouts.some((w) => w.activityId === a.id)) done += a.distance;
  }

  const ahead = workouts
    .filter((w) => w.status === "planned" && w.date >= today)
    .reduce((sum, w) => sum + workoutDistance(w, vdot, goal), 0);

  const target = workouts
    .filter((w) => w.status !== "skipped")
    .reduce((sum, w) => sum + originalDistance(w, vdot, goal), 0);
  return { target, done, ahead, gap: target - done - ahead };
}

/** Returns a copy of the workout whose steady running is `delta` metres longer (or shorter). */
export function resizeWorkout(workout: Workout, delta: number, vdot: number, goal: GoalKind): Workout {
  const index = workout.steps.findIndex((s) => s.kind === "steady");
  if (index < 0) return workout;
  const step = workout.steps[index];
  const value =
    step.measure === "distance"
      ? Math.max(1000, Math.round((step.value + delta) / 100) * 100)
      : Math.max(600, Math.round((step.value + (delta / 1000) * stepPace(step, vdot, goal)) / 30) * 30);
  const steps = workout.steps.map((s, i) => (i === index ? { ...s, value } : s));
  return { ...workout, steps };
}

/**
 * Spreads the week's shortfall (or surplus) over the easy, recovery and long runs still ahead.
 * Hard sessions and races keep their shape. Each run moves by at most a quarter of its size or
 * 2 km when growing, and keeps at least 70% (and 3 km) when shrinking; the rest is dropped.
 */
export function rebalanceWeek(plan: Plan, weekIndex: number, activities: Activity[], vdot: number, today: string): Rebalance | null {
  const balance = weekBalance(plan, weekIndex, activities, vdot, today);
  if (!balance) return null;
  const goal = plan.input.goal;
  const empty: Rebalance = { balance, changes: [], dropped: Math.abs(balance.gap), plan };
  if (Math.abs(balance.gap) < MIN_GAP_METERS) return { ...empty, dropped: 0 };

  const raceWeek = plan.workouts.some((w) => w.week === weekIndex && w.type === "race");
  const flexible = plan.workouts
    .filter((w) => w.week === weekIndex && w.status === "planned" && w.date >= today && FLEXIBLE.includes(w.type))
    .filter((w) => w.steps.some((s) => s.kind === "steady"));
  // Never add distance in a race week: the taper matters more than the total.
  if (flexible.length === 0 || (raceWeek && balance.gap > 0)) return empty;

  const sizes = flexible.map((w) => workoutDistance(w, vdot, goal));
  // Limits are measured from each run's original size, so recalculating twice cannot stack.
  const room = flexible.map((w, i) => {
    const original = originalDistance(w, vdot, goal);
    return balance.gap > 0
      ? Math.max(0, original + Math.min(original * MAX_GROW_SHARE, MAX_GROW_METERS) - sizes[i])
      : Math.max(0, sizes[i] - Math.max(original * MIN_SHRINK_SHARE, Math.min(original, MIN_RUN_METERS)));
  });
  const totalRoom = room.reduce((a, b) => a + b, 0);
  const wanted = Math.abs(balance.gap);
  const used = Math.min(wanted, totalRoom);
  if (used < 100) return empty;

  const sign = balance.gap > 0 ? 1 : -1;
  const changes: RunChange[] = [];
  const resized = new Map<string, Workout>();
  flexible.forEach((w, i) => {
    const delta = sign * used * (room[i] / totalRoom);
    if (Math.abs(delta) < 100) return;
    const next = resizeWorkout(w, delta, vdot, goal);
    const to = workoutDistance(next, vdot, goal);
    if (Math.abs(to - sizes[i]) < 100) return;
    resized.set(w.id, { ...next, plannedDistance: originalDistance(w, vdot, goal) });
    changes.push({ workoutId: w.id, date: w.date, type: w.type, from: sizes[i], to });
  });

  const moved = changes.reduce((sum, c) => sum + (c.to - c.from), 0);
  return {
    balance,
    changes,
    dropped: Math.max(0, sign * (balance.gap - moved)),
    plan: { ...plan, workouts: plan.workouts.map((w) => resized.get(w.id) ?? w) },
  };
}

/** Week index a date falls in, or null outside the plan. */
export function weekIndexOf(plan: Plan, date: string): number | null {
  const week = plan.weeks.find((w) => date >= w.start && date <= addDays(w.start, 6));
  return week ? week.index : null;
}

/** Midday on a plan date, used as the start time of runs logged by hand. */
export function middayOf(date: string): number {
  const d = fromDateKey(date);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}
