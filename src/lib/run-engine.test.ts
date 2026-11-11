import { describe, expect, it } from "vitest";
import type { Fix } from "./geo";
import { createRun, currentPace, movingMs, runReducer, type RunState, toActivity } from "./run-engine";
import { distanceStep, timeStep } from "./workouts";

// About 0.0000898 degrees of latitude per 10 m.
const DEG_PER_M = 1 / 111_195;

function fixAt(meters: number, t: number, accuracy = 5): Fix {
  return { latitude: -6.2 + meters * DEG_PER_M, longitude: 106.8, altitude: 10, accuracy, timestamp: t };
}

function runAtPace(state: RunState, fromM: number, toM: number, t0: number, secPerKm: number): [RunState, number] {
  let s = state;
  let t = t0;
  for (let m = fromM + 10; m <= toM; m += 10) {
    t = t0 + ((m - fromM) / 1000) * secPerKm * 1000;
    s = runReducer(s, { type: "fix", fix: fixAt(m, t) });
  }
  return [s, t];
}

describe("run engine", () => {
  it("accumulates distance, splits and moving time", () => {
    let s = createRun({ steps: [], vdot: 45, goal: "10k", splitUnit: 1000 });
    s = runReducer(s, { type: "start", now: 0 });
    s = runReducer(s, { type: "fix", fix: fixAt(0, 0) });
    let t: number;
    [s, t] = runAtPace(s, 0, 2500, 0, 300);
    expect(s.distance).toBeGreaterThan(2490);
    expect(s.splits).toHaveLength(2);
    expect(s.splits[0].duration).toBeCloseTo(300, 0);
    expect(currentPace(s)).toBeCloseTo(300, -1);
    s = runReducer(s, { type: "finish", now: t });
    expect(s.splits).toHaveLength(3);
    expect(movingMs(s, t + 99_000)).toBe(t);
  });

  it("drops inaccurate fixes and GPS jumps", () => {
    let s = runReducer(createRun({ steps: [], vdot: 45, goal: "10k", splitUnit: 1000 }), { type: "start", now: 0 });
    s = runReducer(s, { type: "fix", fix: fixAt(0, 0) });
    s = runReducer(s, { type: "fix", fix: fixAt(30, 10_000, 80) });
    expect(s.distance).toBe(0);
    s = runReducer(s, { type: "fix", fix: fixAt(500, 11_000) });
    expect(s.distance).toBe(0);
    s = runReducer(s, { type: "fix", fix: fixAt(30, 12_000) });
    expect(s.distance).toBeCloseTo(30, 0);
  });

  it("does not count time or distance while paused", () => {
    let s = runReducer(createRun({ steps: [], vdot: 45, goal: "10k", splitUnit: 1000 }), { type: "start", now: 0 });
    s = runReducer(s, { type: "fix", fix: fixAt(0, 0) });
    s = runReducer(s, { type: "fix", fix: fixAt(100, 30_000) });
    s = runReducer(s, { type: "pause", now: 30_000 });
    s = runReducer(s, { type: "resume", now: 90_000 });
    // First fix after resume re-anchors and adds nothing, even though we moved 200 m during the pause.
    s = runReducer(s, { type: "fix", fix: fixAt(300, 91_000) });
    expect(s.distance).toBeCloseTo(100, 0);
    s = runReducer(s, { type: "fix", fix: fixAt(400, 121_000) });
    expect(s.distance).toBeCloseTo(200, 0);
    expect(movingMs(s, 121_000)).toBe(61_000);
  });

  it("walks through structured steps and records results", () => {
    const steps = [distanceStep("warmup", 1000, "easy"), timeStep("work", 60, "interval"), distanceStep("cooldown", 500, "easy")];
    let s = runReducer(createRun({ steps, vdot: 45, goal: "10k", splitUnit: 1000 }), { type: "start", now: 0 });
    expect(s.cues.map((c) => c.type)).toEqual(["start", "step"]);
    s = runReducer(s, { type: "drainCues" });
    s = runReducer(s, { type: "fix", fix: fixAt(0, 0) });
    let t: number;
    [s, t] = runAtPace(s, 0, 1000, 0, 360);
    expect(s.stepIndex).toBe(1);
    s = runReducer(s, { type: "tick", now: t + 61_000 });
    expect(s.stepIndex).toBe(2);
    expect(s.stepResults[1].duration).toBeCloseTo(61, 0);
    s = runReducer(s, { type: "skipStep", now: t + 62_000 });
    expect(s.cues.some((c) => c.type === "workoutDone")).toBe(true);
    s = runReducer(s, { type: "finish", now: t + 62_000 });
    const activity = toActivity(s, "a1", { workoutId: "w1", workoutType: "intervals" });
    expect(activity.stepResults).toHaveLength(3);
    expect(activity.bestEfforts?.["1k"]).toBeCloseTo(360, -1);
  });

  it("tells the runner to slow down when an interval is far too fast", () => {
    const steps = [timeStep("work", 600, "threshold")];
    let s = runReducer(createRun({ steps, vdot: 40, goal: "10k", splitUnit: 1000 }), { type: "start", now: 0 });
    s = runReducer(s, { type: "drainCues" });
    s = runReducer(s, { type: "fix", fix: fixAt(0, 0) });
    [s] = runAtPace(s, 0, 600, 0, 200);
    expect(s.cues.some((c) => c.type === "slowDown")).toBe(true);
  });
});
