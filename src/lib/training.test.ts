import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISE_MAP } from "../data/exercises";
import { BUILT_IN_ROUTINES } from "../data/routines";
import { generatePlan } from "./plan-generator";
import { scheduleStrength } from "./strength-schedule";
import { weekday } from "./dates";
import {
  estimateOneRepMax,
  exerciseBests,
  exerciseHistory,
  fromDisplayWeight,
  isPersonalBest,
  parseYouTubeId,
  previousSets,
  routineDuration,
  sessionFromRoutine,
  sessionStats,
  toDisplayWeight,
} from "./training";
import type { TrainingSession } from "./training-types";
import { isQuality } from "./workouts";

function finished(id: string, at: number, sets: [string, { reps?: number; weight?: number; seconds?: number; done?: boolean }[]][]): TrainingSession {
  return {
    id,
    name: { en: id, id },
    startedAt: at,
    finishedAt: at + 1800_000,
    exercises: sets.map(([exerciseId, s]) => ({
      exerciseId,
      restSeconds: 60,
      sets: s.map((x) => ({ reps: x.reps ?? null, weight: x.weight ?? null, seconds: x.seconds ?? null, done: x.done ?? true })),
    })),
  };
}

describe("exercise data", () => {
  it("has unique ids, both languages and well-formed video ids", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const e of EXERCISES) {
      expect(e.steps.en.length).toBeGreaterThan(0);
      expect(e.steps.id.length).toBe(e.steps.en.length);
      expect(e.name.en && e.name.id).toBeTruthy();
      if (e.video) expect(e.video.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      for (const text of [...e.steps.en, ...e.steps.id, e.name.en, e.name.id, e.tip?.en ?? "", e.tip?.id ?? ""]) expect(text).not.toContain("—");
    }
  });

  it("covers every category and routines only reference known exercises", () => {
    for (const c of ["strength", "core", "plyometric", "yoga", "diastasis", "mobility"]) {
      expect(EXERCISES.some((e) => e.category === c)).toBe(true);
      expect(BUILT_IN_ROUTINES.some((r) => r.category === c)).toBe(true);
    }
    for (const r of BUILT_IN_ROUTINES) for (const i of r.items) expect(EXERCISE_MAP[i.exerciseId], `${r.id}:${i.exerciseId}`).toBeDefined();
  });

  it("keeps crunch-style loading out of the diastasis routines", () => {
    const dr = BUILT_IN_ROUTINES.filter((r) => r.category === "diastasis").flatMap((r) => r.items.map((i) => i.exerciseId));
    expect(dr).not.toContain("russian-twist");
    expect(dr).not.toContain("plank");
  });
});

describe("sessions", () => {
  const history = [
    finished("old", 1000, [["goblet-squat", [{ reps: 10, weight: 12 }, { reps: 10, weight: 12 }]]]),
    finished("new", 5000, [["goblet-squat", [{ reps: 10, weight: 14 }, { reps: 8, weight: 16 }, { reps: 8, weight: 16, done: false }]]]),
  ];

  it("finds the latest completed sets", () => {
    expect(previousSets(history, "goblet-squat").map((s) => s.weight)).toEqual([14, 16]);
    expect(previousSets(history, "squat")).toEqual([]);
  });

  it("prefills a new session from the routine and last weights", () => {
    const routine = BUILT_IN_ROUTINES.find((r) => r.id === "runner-strength-b")!;
    const s = sessionFromRoutine(routine, EXERCISE_MAP, history, "s1", 10_000, "slot");
    expect(s.exercises).toHaveLength(routine.items.length);
    const goblet = s.exercises[0];
    expect(goblet.sets).toHaveLength(3);
    expect(goblet.sets.map((x) => x.weight)).toEqual([14, 16, 16]);
    expect(goblet.sets[0].reps).toBe(10);
    expect(s.slotId).toBe("slot");
    const pallof = s.exercises.find((e) => e.exerciseId === "pallof-press")!;
    expect(pallof.sets[0].weight).toBeNull();
  });

  it("counts done sets, reps and volume", () => {
    const stats = sessionStats(history[1]);
    expect(stats).toMatchObject({ doneSets: 2, totalSets: 3, reps: 18, volume: 10 * 14 + 8 * 16, duration: 1800 });
  });

  it("tracks bests and history per exercise", () => {
    const b = exerciseBests(history, "goblet-squat");
    expect(b.heaviest).toBe(16);
    expect(b.oneRepMax).toBeCloseTo(estimateOneRepMax(16, 8));
    expect(b.sessions).toBe(2);
    expect(exerciseHistory(history, "goblet-squat")[0].sessionId).toBe("new");
    const hold = exerciseBests([finished("p", 1, [["plank", [{ seconds: 45 }, { seconds: 60 }]]])], "plank");
    expect(hold.longestHold).toBe(60);
  });

  it("estimates 1RM with Epley", () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.3, 0);
  });

  it("converts weight units", () => {
    expect(toDisplayWeight(20, "lb")).toBeCloseTo(44.1, 1);
    expect(fromDisplayWeight(45, "lb")).toBeCloseTo(20.4, 1);
  });

  it("estimates routine length", () => {
    const yoga = BUILT_IN_ROUTINES.find((r) => r.id === "yoga-runners")!;
    const minutes = routineDuration(yoga, EXERCISE_MAP) / 60;
    expect(minutes).toBeGreaterThan(8);
    expect(minutes).toBeLessThan(20);
  });
});

describe("parseYouTubeId", () => {
  it("accepts common link shapes", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=ZLJBfYF_oO0",
      "https://m.youtube.com/watch?feature=share&v=ZLJBfYF_oO0",
      "https://youtu.be/ZLJBfYF_oO0?t=10",
      "https://www.youtube.com/shorts/ZLJBfYF_oO0",
      "https://www.youtube-nocookie.com/embed/ZLJBfYF_oO0",
      "ZLJBfYF_oO0",
    ]) {
      expect(parseYouTubeId(url)).toBe("ZLJBfYF_oO0");
    }
    expect(parseYouTubeId("https://example.com/video")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
  });
});

describe("scheduleStrength", () => {
  const plan = generatePlan(
    { goal: "10k", runDays: [1, 3, 6], longRunDay: 6, weeks: 8, startDate: "2026-11-09", vdot: 42, weeklyDistance: 20000 },
    { planId: "p" },
  );

  it("keeps strength off hard days and the day before them", () => {
    const slots = scheduleStrength(plan, 2);
    expect(slots.length).toBeGreaterThan(8);
    for (const s of slots) {
      const hard = plan.workouts.filter((w) => w.week === s.week && (w.type === "long" || isQuality(w.type))).map((w) => weekday(w.date));
      const d = weekday(s.date);
      expect(hard).not.toContain(d);
      expect(hard).not.toContain((d + 1) % 7);
    }
  });

  it("never stacks sessions on consecutive days and skips race week", () => {
    const slots = scheduleStrength(plan, 2);
    for (const week of plan.weeks) {
      const days = slots.filter((s) => s.week === week.index).map((s) => weekday(s.date));
      for (let i = 1; i < days.length; i++) expect(days[i] - days[i - 1]).toBeGreaterThan(1);
    }
    const raceWeek = plan.workouts.find((w) => w.type === "race")!.week;
    expect(slots.some((s) => s.week === raceWeek)).toBe(false);
    expect(scheduleStrength(plan, 0)).toEqual([]);
  });

  it("alternates routines and uses the light one in taper", () => {
    const slots = scheduleStrength(plan, 1);
    const routines = new Set(slots.map((s) => s.routineId));
    expect(routines.has("runner-strength-a")).toBe(true);
    expect(routines.has("runner-strength-b")).toBe(true);
    for (const s of slots) {
      if (plan.weeks[s.week].phase === "taper") expect(s.routineId).toBe("hip-stability");
    }
  });
});

describe("isPersonalBest", () => {
  const history = [finished("a", 1, [["goblet-squat", [{ reps: 10, weight: 14 }]], ["push-up", [{ reps: 12 }]], ["plank", [{ seconds: 45 }]]])];
  const done = (x: Partial<{ reps: number; weight: number; seconds: number }>) => ({ reps: x.reps ?? null, weight: x.weight ?? null, seconds: x.seconds ?? null, done: true });

  it("flags heavier sets, more bodyweight reps and longer holds", () => {
    expect(isPersonalBest(done({ reps: 8, weight: 16 }), exerciseBests(history, "goblet-squat"))).toBe(true);
    expect(isPersonalBest(done({ reps: 12, weight: 14 }), exerciseBests(history, "goblet-squat"))).toBe(false);
    expect(isPersonalBest(done({ reps: 13 }), exerciseBests(history, "push-up"))).toBe(true);
    expect(isPersonalBest(done({ seconds: 50 }), exerciseBests(history, "plank"))).toBe(true);
  });

  it("never flags a first-ever session or an unticked set", () => {
    expect(isPersonalBest(done({ reps: 20 }), exerciseBests(history, "squat"))).toBe(false);
    expect(isPersonalBest({ ...done({ reps: 8, weight: 30 }), done: false }, exerciseBests(history, "goblet-squat"))).toBe(false);
  });
});
