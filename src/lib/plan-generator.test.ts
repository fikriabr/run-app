import { describe, expect, it } from "vitest";
import { addDays, weekday } from "./dates";
import { generatePlan, pickQualityDays, weeklyShapes } from "./plan-generator";
import type { PlanInput } from "./types";
import { isQuality, workoutDistance } from "./workouts";

const base: PlanInput = {
  goal: "10k",
  runDays: [1, 3, 5, 6],
  longRunDay: 6,
  weeks: 10,
  startDate: "2026-11-09",
  vdot: 42,
  weeklyDistance: 20000,
};

describe("weeklyShapes", () => {
  it("never grows volume more than 10% over the last full week", () => {
    const shapes = weeklyShapes({ ...base, goal: "marathon", weeks: 18, weeklyDistance: 25000, runDays: [0, 1, 3, 5, 6] });
    let lastFull = shapes[0].volume;
    for (const s of shapes.slice(1)) {
      if (s.phase === "taper") break;
      expect(s.volume).toBeLessThanOrEqual(lastFull * 1.1 + 1);
      if (s.volume >= lastFull) lastFull = s.volume;
    }
  });

  it("ends a race plan with taper weeks and one race week", () => {
    const shapes = weeklyShapes({ ...base, goal: "half", weeks: 12 });
    expect(shapes).toHaveLength(12);
    expect(shapes.slice(-2).map((s) => s.phase)).toEqual(["taper", "taper"]);
    expect(shapes.filter((s) => s.isRaceWeek)).toHaveLength(1);
  });
});

describe("pickQualityDays", () => {
  it("keeps hard days away from the long run and each other", () => {
    expect(pickQualityDays([1, 3, 5, 6], 6, 1)).toEqual([3]);
    const two = pickQualityDays([0, 1, 2, 3, 4, 6], 6, 2);
    expect(two).toHaveLength(2);
    expect(Math.abs(two[0] - two[1])).toBeGreaterThan(1);
  });
});

describe("generatePlan", () => {
  const plan = generatePlan(base, { planId: "p", now: 0 });

  it("schedules exactly the chosen run days", () => {
    for (const w of plan.workouts) expect(base.runDays).toContain(weekday(w.date));
    const firstWeek = plan.workouts.filter((w) => w.week === 0);
    expect(firstWeek).toHaveLength(4);
  });

  it("puts the long run on the long-run day outside race week", () => {
    const longs = plan.workouts.filter((w) => w.type === "long");
    expect(longs.length).toBe(9);
    for (const l of longs) expect(weekday(l.date)).toBe(6);
  });

  it("ends with the race at goal distance and nothing after it", () => {
    const last = plan.workouts[plan.workouts.length - 1];
    expect(last.type).toBe("race");
    expect(workoutDistance(last, base.vdot, base.goal)).toBe(10000);
  });

  it("places the race on the race date when given", () => {
    const raceDate = addDays(base.startDate, 9 * 7 + 5);
    const p = generatePlan({ ...base, raceDate }, { planId: "r" });
    expect(p.workouts.find((w) => w.type === "race")?.date).toBe(raceDate);
  });

  it("includes at least one quality session per week after base", () => {
    for (const week of plan.weeks.filter((w) => w.phase === "build" || w.phase === "peak")) {
      expect(plan.workouts.some((w) => w.week === week.index && isQuality(w.type))).toBe(true);
    }
  });

  it("keeps each training week within 25% of its target volume", () => {
    for (const week of plan.weeks.filter((w) => w.phase !== "taper")) {
      const total = plan.workouts
        .filter((w) => w.week === week.index)
        .reduce((sum, w) => sum + workoutDistance(w, base.vdot, base.goal), 0);
      expect(total / week.targetDistance).toBeGreaterThan(0.75);
      expect(total / week.targetDistance).toBeLessThan(1.25);
    }
  });

  it("skips days before a mid-week start", () => {
    const p = generatePlan(base, { planId: "m", skipBefore: "2026-11-12" });
    expect(p.workouts.every((w) => w.date >= "2026-11-12")).toBe(true);
  });

  it("builds a fitness plan without a race", () => {
    const p = generatePlan({ ...base, goal: "fitness", runDays: [0, 2, 4], longRunDay: 4, weeks: 8 }, { planId: "f" });
    expect(p.workouts.some((w) => w.type === "race")).toBe(false);
    expect(p.weeks.every((w) => w.phase === "base" || w.phase === "maintain")).toBe(true);
  });

  it("handles two run days", () => {
    const p = generatePlan({ ...base, runDays: [2, 6], longRunDay: 6, weeks: 6, goal: "5k" }, { planId: "t" });
    expect(p.workouts.length).toBeGreaterThanOrEqual(11);
  });
});
