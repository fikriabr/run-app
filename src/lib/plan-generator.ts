import { addDays, daysBetween, weekday } from "./dates";
import type { GoalKind, Phase, Plan, PlanInput, PlanWeek, Workout, WorkoutStep, WorkoutType } from "./types";
import { GOAL_DISTANCE } from "./vdot";
import { distanceStep, repeat, timeStep, workoutDistance } from "./workouts";

const PEAK_CAP_KM: Record<GoalKind, number> = { "5k": 45, "10k": 55, half: 65, marathon: 85, fitness: 40 };
const PEAK_MIN_KM: Record<GoalKind, number> = { "5k": 18, "10k": 24, half: 32, marathon: 45, fitness: 15 };
const LONG_MAX_KM: Record<GoalKind, number> = { "5k": 14, "10k": 18, half: 22, marathon: 32, fitness: 16 };
const TAPER: Record<GoalKind, number[]> = {
  "5k": [0.6],
  "10k": [0.6],
  half: [0.75, 0.5],
  marathon: [0.75, 0.6, 0.4],
  fitness: [],
};

export const DEFAULT_WEEKS: Record<GoalKind, number> = { "5k": 8, "10k": 10, half: 12, marathon: 16, fitness: 8 };
export const MIN_WEEKS = 4;
export const MAX_WEEKS = 24;

interface WeekShape {
  phase: Phase;
  volume: number;
  /** 0..1 progress through the phase, used to grow session size. */
  progress: number;
  isRaceWeek: boolean;
}

export function weeklyShapes(input: PlanInput): WeekShape[] {
  const { goal, weeks } = input;
  const taper = TAPER[goal].slice(0, Math.max(0, weeks - 3));
  const trainingWeeks = weeks - taper.length;
  const dayCap = input.runDays.length * 16_000;
  const start = Math.max(input.weeklyDistance, input.runDays.length * 3000);
  const peak = Math.min(
    dayCap,
    PEAK_CAP_KM[goal] * 1000,
    Math.max(start * 1.6, PEAK_MIN_KM[goal] * 1000),
  );

  const baseWeeks = Math.max(1, Math.round(trainingWeeks * 0.4));
  const buildWeeks = goal === "fitness" ? trainingWeeks - baseWeeks : Math.max(1, Math.round(trainingWeeks * 0.35));
  const peakWeeks = trainingWeeks - baseWeeks - buildWeeks;

  const shapes: WeekShape[] = [];
  let lastFull = start;
  for (let i = 0; i < trainingWeeks; i++) {
    const t = trainingWeeks === 1 ? 1 : i / (trainingWeeks - 1);
    const linear = start + (peak - start) * Math.pow(t, 0.9);
    // Cap week-on-week growth at 10% of the last full week.
    let volume = Math.min(linear, lastFull * 1.1);
    const isCutback = i % 4 === 3 && i < trainingWeeks - 1;
    if (isCutback) volume = lastFull * 0.8;
    else lastFull = volume;

    let phase: Phase;
    let progress: number;
    if (i < baseWeeks) {
      phase = "base";
      progress = baseWeeks === 1 ? 1 : i / (baseWeeks - 1);
    } else if (i < baseWeeks + buildWeeks) {
      phase = "build";
      progress = buildWeeks === 1 ? 1 : (i - baseWeeks) / (buildWeeks - 1);
    } else {
      phase = "peak";
      progress = peakWeeks <= 1 ? 1 : (i - baseWeeks - buildWeeks) / (peakWeeks - 1);
    }
    shapes.push({ phase, volume, progress, isRaceWeek: false });
  }

  taper.forEach((factor, i) => {
    shapes.push({
      phase: "taper",
      volume: lastFull * factor,
      progress: taper.length === 1 ? 1 : i / (taper.length - 1),
      isRaceWeek: i === taper.length - 1,
    });
  });

  if (goal === "fitness") shapes.forEach((s) => (s.phase = s.phase === "base" ? "base" : "maintain"));
  return shapes;
}

/** Circular distance between two weekdays. */
function dayGap(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 7 - d);
}

/** Picks `count` quality days that sit furthest from the long run and from each other. */
export function pickQualityDays(runDays: number[], longDay: number, count: number): number[] {
  const chosen: number[] = [];
  const candidates = runDays.filter((d) => d !== longDay);
  for (let n = 0; n < count && candidates.length > 0; n++) {
    let best = -1;
    let bestScore = -Infinity;
    for (const d of candidates) {
      if (chosen.includes(d)) continue;
      const gaps = [dayGap(d, longDay), ...chosen.map((c) => dayGap(d, c))];
      // Back-to-back hard days are what injure people, so the closest neighbour dominates.
      const score = Math.min(...gaps) * 10 + gaps.reduce((a, b) => a + b, 0);
      if (score > bestScore) {
        bestScore = score;
        best = d;
      }
    }
    if (best >= 0) chosen.push(best);
  }
  return chosen.sort((a, b) => a - b);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function warmup(volume: number): WorkoutStep {
  return distanceStep("warmup", volume < 20_000 ? 1500 : 2000, "easy");
}

function cooldown(volume: number): WorkoutStep {
  return distanceStep("cooldown", volume < 20_000 ? 1000 : 1500, "easy");
}

interface Session {
  type: WorkoutType;
  steps: WorkoutStep[];
}

function stridesSession(easyMeters: number): Session {
  return {
    type: "strides",
    steps: [
      distanceStep("steady", Math.max(3000, easyMeters), "easy"),
      ...repeat(6, timeStep("work", 20, "repetition"), timeStep("recover", 60, null)),
    ],
  };
}

function fartlekSession(p: number, volume: number): Session {
  const reps = Math.round(lerp(6, 10, p));
  return {
    type: "fartlek",
    steps: [warmup(volume), ...repeat(reps, timeStep("work", 60, "interval"), timeStep("recover", 90, "easy")), cooldown(volume)],
  };
}

function progressionSession(p: number, volume: number): Session {
  const total = lerp(5000, 9000, p) * Math.min(1.3, Math.max(0.7, volume / 30_000));
  return {
    type: "progression",
    steps: [
      distanceStep("steady", total * 0.5, "easy"),
      distanceStep("steady", total * 0.3, "marathon"),
      distanceStep("work", total * 0.2, "threshold"),
    ],
  };
}

function tempoSession(goal: GoalKind, p: number, volume: number, cruise: boolean): Session {
  const long = goal === "half" || goal === "marathon";
  if (cruise) {
    const reps = Math.round(lerp(3, long ? 5 : 4, p));
    return {
      type: "tempo",
      steps: [warmup(volume), ...repeat(reps, distanceStep("work", 1600, "threshold"), timeStep("recover", 60, "easy")), cooldown(volume)],
    };
  }
  const minutes = Math.round(lerp(15, long ? 35 : 25, p));
  return { type: "tempo", steps: [warmup(volume), timeStep("work", minutes * 60, "threshold"), cooldown(volume)] };
}

function intervalSession(goal: GoalKind, p: number, volume: number, peak: boolean): Session {
  if (goal === "5k" && peak) {
    const reps = Math.round(lerp(8, 10, p));
    return {
      type: "intervals",
      steps: [warmup(volume), ...repeat(reps, distanceStep("work", 400, "repetition"), distanceStep("recover", 400, "easy")), cooldown(volume)],
    };
  }
  const plan: Record<GoalKind, [number, number, number, number]> = {
    // [rep metres, min reps, max reps, recovery seconds]
    "5k": [800, 5, 7, 120],
    "10k": [1000, 4, 6, 150],
    half: [1200, 4, 6, 150],
    marathon: [1000, 5, 6, 150],
    fitness: [800, 4, 6, 120],
  };
  const [meters, minReps, maxReps, rest] = plan[goal];
  const reps = Math.round(lerp(minReps, maxReps, p));
  return {
    type: "intervals",
    steps: [warmup(volume), ...repeat(reps, distanceStep("work", meters, "interval"), timeStep("recover", rest, "easy")), cooldown(volume)],
  };
}

function racePaceSession(goal: GoalKind, p: number, volume: number, taper: boolean): Session {
  const shape: Record<Exclude<GoalKind, "fitness">, [number, number, number, number]> = {
    // [rep metres, min reps, max reps, recovery seconds]
    "5k": [1000, 3, 5, 90],
    "10k": [2000, 3, 4, 120],
    half: [3000, 2, 4, 120],
    marathon: [5000, 2, 3, 180],
  };
  const g = goal === "fitness" ? "10k" : goal;
  const [meters, minReps, maxReps, rest] = shape[g];
  const reps = taper ? minReps - 1 || 1 : Math.round(lerp(minReps, maxReps, p));
  return {
    type: "racePace",
    steps: [warmup(volume), ...repeat(reps, distanceStep("work", meters, "race"), timeStep("recover", rest, "easy")), cooldown(volume)],
  };
}

function qualityFor(
  input: PlanInput,
  shape: WeekShape,
  slot: number,
  weekIndex: number,
  easyMeters: number,
): Session {
  const { goal } = input;
  const p = shape.progress;
  const v = shape.volume;
  const alternate = weekIndex % 2 === 0;
  switch (shape.phase) {
    case "base":
      if (slot === 0) return p < 0.5 ? stridesSession(easyMeters) : fartlekSession(p, v);
      return progressionSession(p, v);
    case "build":
      if (slot === 0) return tempoSession(goal, p, v, !alternate);
      return intervalSession(goal, p, v, false);
    case "peak":
      if (slot === 0) {
        return goal === "half" || goal === "marathon" ? racePaceSession(goal, p, v, false) : intervalSession(goal, p, v, true);
      }
      return goal === "half" || goal === "marathon" ? intervalSession(goal, p, v, false) : racePaceSession(goal, p, v, false);
    case "taper":
      return racePaceSession(goal, p, v, true);
    case "maintain": {
      const options = [tempoSession(goal, p, v, alternate), fartlekSession(p, v), progressionSession(p, v)];
      return options[(weekIndex + slot) % options.length];
    }
  }
}

function longRun(goal: GoalKind, shape: WeekShape, meters: number, weekIndex: number): Session {
  const total = Math.round(meters / 500) * 500;
  // Marathon and half runners practise goal pace at the end of alternate peak long runs.
  if (shape.phase === "peak" && (goal === "marathon" || goal === "half") && weekIndex % 2 === 1) {
    const fast = goal === "marathon" ? Math.min(total * 0.35, 12_000) : Math.min(total * 0.3, 6000);
    return {
      type: "long",
      steps: [distanceStep("steady", total - fast, "long"), distanceStep("work", fast, "race")],
    };
  }
  return { type: "long", steps: [distanceStep("steady", total, "long")] };
}

function easyRun(meters: number, recovery: boolean): Session {
  const rounded = Math.max(3000, Math.round(meters / 500) * 500);
  return { type: recovery ? "recovery" : "easy", steps: [distanceStep("steady", rounded, "easy")] };
}

export interface GenerateOptions {
  planId: string;
  /** Workouts dated before this day are left out, for plans that start mid-week. */
  skipBefore?: string;
  now?: number;
}

export function generatePlan(input: PlanInput, options: GenerateOptions): Plan {
  const runDays = [...new Set(input.runDays)].sort((a, b) => a - b);
  const longDay = runDays.includes(input.longRunDay) ? input.longRunDay : runDays[runDays.length - 1];
  const shapes = weeklyShapes({ ...input, runDays });
  const weeks: PlanWeek[] = [];
  const workouts: Workout[] = [];

  shapes.forEach((shape, w) => {
    const weekStart = addDays(input.startDate, w * 7);
    weeks.push({ index: w, phase: shape.phase, start: weekStart, targetDistance: Math.round(shape.volume) });

    const qualityCount =
      runDays.length >= 5 && (shape.phase === "build" || shape.phase === "peak" || shape.phase === "maintain")
        ? 2
        : runDays.length >= 3 || shape.phase !== "base"
          ? 1
          : 0;
    const qualityDays = shape.isRaceWeek ? [] : pickQualityDays(runDays, longDay, qualityCount);
    const easyDays = runDays.filter((d) => d !== longDay && !qualityDays.includes(d));

    const longMeters = Math.min(LONG_MAX_KM[input.goal] * 1000, Math.max(4000, shape.volume * 0.3));
    const roughEasy = shape.volume / Math.max(1, runDays.length);
    const sessions = new Map<number, Session>();
    qualityDays.forEach((day, slot) => sessions.set(day, qualityFor(input, shape, slot, w, roughEasy)));

    if (shape.isRaceWeek && input.goal !== "fitness") {
      let raceDay = longDay;
      if (input.raceDate) {
        const offset = daysBetween(weekStart, input.raceDate);
        if (offset >= 0 && offset < 7) raceDay = weekday(input.raceDate);
      }
      sessions.set(raceDay, { type: "race", steps: [distanceStep("work", GOAL_DISTANCE[input.goal], "race")] });
      // Before the race: one short sharpener mid-week, the rest short and easy. Nothing after race day.
      const before = runDays.filter((d) => d < raceDay);
      const sharpenerDay = before.length >= 2 ? before[before.length - 2] : undefined;
      for (const d of before) {
        if (d === sharpenerDay) sessions.set(d, racePaceSession(input.goal, 0, shape.volume, true));
        else sessions.set(d, easyRun(Math.min(5000, roughEasy), d === before[before.length - 1]));
      }
    } else {
      sessions.set(longDay, longRun(input.goal, shape, longMeters, w));
      let used = 0;
      sessions.forEach((s) => (used += workoutDistance(s, input.vdot, input.goal)));
      const remaining = Math.max(0, shape.volume - used);
      const perEasy = easyDays.length > 0 ? remaining / easyDays.length : 0;
      easyDays.forEach((d) => {
        const dayAfterHard = qualityDays.includes((d + 6) % 7) || (d + 6) % 7 === longDay;
        sessions.set(d, easyRun(dayAfterHard ? perEasy * 0.8 : perEasy, dayAfterHard && perEasy < 6000));
      });
    }

    [...sessions.entries()]
      .sort(([a], [b]) => a - b)
      .forEach(([day, session]) => {
        const date = addDays(weekStart, day);
        if (options.skipBefore && date < options.skipBefore) return;
        workouts.push({
          id: `${options.planId}-${w}-${day}`,
          date,
          week: w,
          type: session.type,
          steps: session.steps,
          status: "planned",
        });
      });
  });

  return { id: options.planId, createdAt: options.now ?? Date.now(), input: { ...input, runDays, longRunDay: longDay }, weeks, workouts };
}

/** Number of plan weeks that fit between the start Monday and the race date (inclusive). */
export function weeksUntil(startMonday: string, raceDate: string): number {
  return Math.floor(daysBetween(startMonday, raceDate) / 7) + 1;
}
