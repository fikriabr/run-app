import { describe, expect, it } from "vitest";
import { generatePlan } from "./plan-generator";
import { middayOf, rebalanceWeek, resizeWorkout, weekBalance } from "./rebalance";
import type { Activity, Plan, PlanInput } from "./types";
import { isQuality, workoutDistance } from "./workouts";

const input: PlanInput = {
  goal: "10k",
  runDays: [1, 3, 5, 6],
  longRunDay: 6,
  weeks: 10,
  startDate: "2026-11-09",
  vdot: 42,
  weeklyDistance: 25000,
};
const VDOT = 42;

function activity(id: string, date: string, distance: number, workoutId?: string): Activity {
  return { id, startedAt: middayOf(date), duration: distance * 0.36, distance, elevationGain: 0, splits: [], pointCount: 0, workoutId };
}

/** Week 2 with its first run logged at `ran` metres. */
function weekWithFirstRun(ran: number): { plan: Plan; activities: Activity[]; today: string } {
  const plan = generatePlan(input, { planId: "p", now: 0 });
  const week = plan.workouts.filter((w) => w.week === 1);
  const first = week[0];
  const activities = [activity("a1", first.date, ran, first.id)];
  const marked: Plan = {
    ...plan,
    workouts: plan.workouts.map((w) => (w.id === first.id ? { ...w, status: "completed", activityId: "a1" } : w)),
  };
  return { plan: marked, activities, today: week[1].date };
}

describe("weekBalance", () => {
  it("counts logged distance and the runs still ahead", () => {
    const { plan, activities, today } = weekWithFirstRun(5000);
    const b = weekBalance(plan, 1, activities, VDOT, today)!;
    expect(b.done).toBe(5000);
    const ahead = plan.workouts.filter((w) => w.week === 1 && w.date >= today).reduce((s, w) => s + workoutDistance(w, VDOT, "10k"), 0);
    expect(b.ahead).toBeCloseTo(ahead);
    expect(b.gap).toBeCloseTo(b.target - b.done - b.ahead);
  });

  it("counts free runs inside the week", () => {
    const { plan, activities, today } = weekWithFirstRun(5000);
    const extra = activity("free", today, 4000);
    const before = weekBalance(plan, 1, activities, VDOT, today)!;
    const after = weekBalance(plan, 1, [...activities, extra], VDOT, today)!;
    expect(after.done - before.done).toBe(4000);
  });
});

describe("rebalanceWeek", () => {
  it("adds a short run's missing distance to easy and long runs only, within safe limits", () => {
    const plan0 = generatePlan(input, { planId: "p", now: 0 });
    const planned = workoutDistance(plan0.workouts.filter((w) => w.week === 1)[0], VDOT, "10k");
    const { plan, activities, today } = weekWithFirstRun(planned - 2000);
    const r = rebalanceWeek(plan, 1, activities, VDOT, today)!;
    expect(r.balance.gap).toBeGreaterThan(1500);
    expect(r.changes.length).toBeGreaterThan(0);
    for (const c of r.changes) {
      const w = plan.workouts.find((x) => x.id === c.workoutId)!;
      expect(isQuality(w.type)).toBe(false);
      expect(c.to).toBeGreaterThan(c.from);
      expect(c.to - c.from).toBeLessThanOrEqual(Math.min(c.from * 0.25, 2000) + 100);
    }
    const added = r.changes.reduce((s, c) => s + c.to - c.from, 0);
    expect(added + r.dropped).toBeCloseTo(r.balance.gap, -2);
    // Recalculating again cannot grow the runs further.
    const again = rebalanceWeek(r.plan, 1, activities, VDOT, today)!;
    expect(again.changes).toEqual([]);
    // Other weeks are untouched.
    expect(r.plan.workouts.filter((w) => w.week !== 1)).toEqual(plan.workouts.filter((w) => w.week !== 1));
  });

  it("trims easy runs after a longer run than planned, never below 3 km", () => {
    const plan0 = generatePlan(input, { planId: "p", now: 0 });
    const planned = workoutDistance(plan0.workouts.filter((w) => w.week === 1)[0], VDOT, "10k");
    const { plan, activities, today } = weekWithFirstRun(planned + 3000);
    const r = rebalanceWeek(plan, 1, activities, VDOT, today)!;
    expect(r.balance.gap).toBeLessThan(-2500);
    for (const c of r.changes) {
      expect(c.to).toBeLessThan(c.from);
      expect(c.to).toBeGreaterThanOrEqual(Math.min(c.from, 3000) - 100);
    }
  });

  it("finds no gap in a week where nothing has happened yet", () => {
    const plan = generatePlan(input, { planId: "p", now: 0 });
    const first = plan.workouts.find((w) => w.week === 1)!;
    expect(weekBalance(plan, 1, [], VDOT, first.date)!.gap).toBeCloseTo(0);
  });

  it("does nothing for a small gap", () => {
    const plan0 = generatePlan(input, { planId: "p", now: 0 });
    const planned = workoutDistance(plan0.workouts.filter((w) => w.week === 1)[0], VDOT, "10k");
    const { plan, activities, today } = weekWithFirstRun(planned);
    const r = rebalanceWeek(plan, 1, activities, VDOT, today)!;
    expect(r.changes).toEqual([]);
  });
});

describe("resizeWorkout", () => {
  it("changes only the steady part and rounds to 100 m", () => {
    const w = { id: "x", date: "2026-11-10", week: 0, type: "easy" as const, status: "planned" as const, steps: [{ kind: "steady" as const, measure: "distance" as const, value: 6000, zone: "easy" as const }] };
    expect(resizeWorkout(w, 1234, VDOT, "10k").steps[0].value).toBe(7200);
  });
});
