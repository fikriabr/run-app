import { describe, expect, it } from "vitest";
import { moveWorkout, assessWorkout, missedWorkouts } from "./adapt";
import { generatePlan } from "./plan-generator";
import { bestEfforts, personalBests, weeklyTotals, weekStreak } from "./stats";
import type { Activity, RoutePoint } from "./types";
import { toGpx } from "./gpx";

const DEG_PER_M = 1 / 111_195;

function line(meters: number, secPerKm: number): RoutePoint[] {
  const pts: RoutePoint[] = [];
  for (let m = 0; m <= meters; m += 10) pts.push([m * DEG_PER_M, 0, (m / 1000) * secPerKm * 1000, null]);
  return pts;
}

function activity(id: string, date: string, distance: number, extra: Partial<Activity> = {}): Activity {
  return { id, startedAt: new Date(`${date}T07:00:00`).getTime(), duration: distance * 0.3, distance, elevationGain: 0, splits: [], pointCount: 0, ...extra };
}

describe("stats", () => {
  it("finds the fastest window inside a run", () => {
    const slow = line(3000, 360);
    const fastStart = slow[slow.length - 1][2];
    const fast = line(1500, 240).map(([lat, lon, t]) => [lat + 3000 * DEG_PER_M, lon, fastStart + t, null] as RoutePoint);
    const efforts = bestEfforts([...slow, ...fast.slice(1)]);
    expect(efforts["1k"]).toBeCloseTo(240, -1);
    expect(efforts["5k"]).toBeUndefined();
  });

  it("totals weeks including empty ones", () => {
    const now = new Date("2026-11-11T12:00:00");
    const weeks = weeklyTotals([activity("a", "2026-11-10", 5000), activity("b", "2026-11-03", 8000)], 4, now);
    expect(weeks.map((w) => w.distance)).toEqual([0, 0, 8000, 5000]);
    expect(weekStreak([activity("a", "2026-11-10", 5000), activity("b", "2026-11-03", 8000)], now)).toBe(2);
  });

  it("keeps the best effort per distance", () => {
    const pbs = personalBests([
      activity("a", "2026-11-01", 5000, { bestEfforts: { "1k": 250, "5k": 1400 } }),
      activity("b", "2026-11-05", 5000, { bestEfforts: { "1k": 240, "5k": 1450 } }),
    ]);
    expect(pbs.find((p) => p.key === "1k")?.activityId).toBe("b");
    expect(pbs.find((p) => p.key === "5k")?.activityId).toBe("a");
  });

  it("exports valid-looking GPX", () => {
    const gpx = toGpx(activity("a", "2026-11-01", 100), line(20, 300), "Easy & short");
    expect(gpx).toContain("<trkpt");
    expect(gpx).toContain("Easy &amp; short");
  });
});

describe("adapt", () => {
  const plan = generatePlan(
    { goal: "10k", runDays: [1, 3, 6], longRunDay: 6, weeks: 8, startDate: "2026-11-09", vdot: 42, weeklyDistance: 20000 },
    { planId: "p" },
  );

  it("eases paces when an easy run felt hard", () => {
    const easy = plan.workouts.find((w) => w.type === "easy" || w.type === "recovery")!;
    expect(assessWorkout(easy, activity("a", easy.date, 5000), 7, 42, "10k")).toEqual({ delta: -1, reason: "harder" });
    expect(assessWorkout(easy, activity("a", easy.date, 5000), 3, 42, "10k")).toBeNull();
  });

  it("raises fitness when work reps beat the target comfortably", () => {
    const tempo = plan.workouts.find((w) => w.type === "tempo")!;
    const work = tempo.steps.findIndex((s) => s.kind === "work");
    const results = [{ index: work, distance: 3000, duration: 3 * 230 }];
    expect(assessWorkout(tempo, activity("a", tempo.date, 8000, { stepResults: results }), 6, 42, "10k")?.reason).toBe(
      "fasterThanTarget",
    );
  });

  it("lists missed runs and moves workouts within a week", () => {
    expect(missedWorkouts(plan, "2026-11-16").length).toBe(3);
    const first = plan.workouts[0];
    const moved = moveWorkout(plan, first.id, "2026-11-11");
    expect(moved.workouts.find((w) => w.id === first.id)?.date).toBe("2026-11-11");
    const swapped = moveWorkout(plan, first.id, plan.workouts[1].date);
    expect(swapped.workouts.find((w) => w.id === plan.workouts[1].id)?.date).toBe(first.date);
    expect(moveWorkout(plan, first.id, "2026-12-30")).toBe(plan);
  });
});
