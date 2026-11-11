import { elevationGain, type Fix, judgeFix } from "./geo";
import type { Activity, GoalKind, RoutePoint, Split, StepResult, WorkoutStep } from "./types";
import { type PaceRange, zonePace } from "./vdot";
import { bestEfforts } from "./stats";

export type Cue =
  | { type: "start" }
  | { type: "step"; index: number }
  | { type: "split"; number: number; seconds: number }
  | { type: "speedUp" }
  | { type: "slowDown" }
  | { type: "paused" }
  | { type: "resumed" }
  | { type: "workoutDone" };

export interface RunState {
  status: "ready" | "running" | "paused" | "finished";
  startedAt: number | null;
  /** Moving time banked from finished running segments, ms. */
  bankedMs: number;
  /** Wall-clock start of the current running segment, ms. */
  segmentStart: number | null;
  distance: number;
  lastFix: Fix | null;
  /** Append-only and shared between states to avoid copying thousands of points per fix. */
  points: RoutePoint[];
  /** Recent [moving ms, cumulative distance] samples for current pace. */
  recent: [number, number][];
  splitUnit: number;
  splits: Split[];
  splitStartDistance: number;
  splitStartMs: number;
  steps: WorkoutStep[];
  paces: (PaceRange | null)[];
  stepIndex: number;
  stepStartDistance: number;
  stepStartMs: number;
  stepResults: StepResult[];
  lastPaceCueMs: number;
  cues: Cue[];
}

export type RunEvent =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "fix"; fix: Fix }
  | { type: "tick"; now: number }
  | { type: "skipStep"; now: number }
  | { type: "finish"; now: number }
  | { type: "drainCues" };

export interface RunSetup {
  steps: WorkoutStep[];
  vdot: number;
  goal: GoalKind;
  /** Split length in metres: 1000 or one mile. */
  splitUnit: number;
}

export function createRun(setup: RunSetup): RunState {
  return {
    status: "ready",
    startedAt: null,
    bankedMs: 0,
    segmentStart: null,
    distance: 0,
    lastFix: null,
    points: [],
    recent: [],
    splitUnit: setup.splitUnit,
    splits: [],
    splitStartDistance: 0,
    splitStartMs: 0,
    steps: setup.steps,
    paces: setup.steps.map((s) => (s.zone ? zonePace(setup.vdot, s.zone, setup.goal) : null)),
    stepIndex: 0,
    stepStartDistance: 0,
    stepStartMs: 0,
    stepResults: [],
    lastPaceCueMs: 0,
    cues: [],
  };
}

export function movingMs(state: RunState, now: number): number {
  return state.bankedMs + (state.segmentStart != null ? Math.max(0, now - state.segmentStart) : 0);
}

const PACE_WINDOW_MS = 20_000;
// Half a metre of slack so float error in haversine never delays a split or step by a whole fix.
const EPSILON_M = 0.5;

/** Current pace in seconds per km over the last ~20 s of moving time, or null when there is too little movement. */
export function currentPace(state: RunState): number | null {
  const r = state.recent;
  if (r.length < 2) return null;
  const [t0, d0] = r[0];
  const [t1, d1] = r[r.length - 1];
  const meters = d1 - d0;
  if (meters < 15 || t1 - t0 < 5000) return null;
  return (t1 - t0) / 1000 / (meters / 1000);
}

export function averagePace(distance: number, ms: number): number | null {
  if (distance < 50) return null;
  return ms / 1000 / (distance / 1000);
}

/** Progress through the current step, 0..1, plus what is left in the step's own measure. */
export function stepProgress(state: RunState, now: number): { fraction: number; remaining: number } | null {
  const step = state.steps[state.stepIndex];
  if (!step) return null;
  const done =
    step.measure === "distance"
      ? state.distance - state.stepStartDistance
      : (movingMs(state, now) - state.stepStartMs) / 1000;
  const slack = step.measure === "distance" ? EPSILON_M : 0;
  return { fraction: Math.min(1, done / step.value), remaining: Math.max(0, step.value - done - slack) };
}

function closeStep(state: RunState, ms: number): RunState {
  const result: StepResult = {
    index: state.stepIndex,
    distance: state.distance - state.stepStartDistance,
    duration: (ms - state.stepStartMs) / 1000,
  };
  const nextIndex = state.stepIndex + 1;
  const done = nextIndex >= state.steps.length;
  return {
    ...state,
    stepResults: [...state.stepResults, result],
    stepIndex: nextIndex,
    stepStartDistance: state.distance,
    stepStartMs: ms,
    lastPaceCueMs: ms,
    cues: [...state.cues, done ? { type: "workoutDone" } : { type: "step", index: nextIndex }],
  };
}

function advance(state: RunState, now: number): RunState {
  if (state.status !== "running") return state;
  let s = state;
  const ms = movingMs(s, now);

  while (s.distance - s.splitStartDistance >= s.splitUnit - EPSILON_M) {
    const seconds = (ms - s.splitStartMs) / 1000;
    s = {
      ...s,
      splits: [...s.splits, { distance: s.splitUnit, duration: seconds }],
      splitStartDistance: s.splitStartDistance + s.splitUnit,
      splitStartMs: ms,
      cues: [...s.cues, { type: "split", number: s.splits.length + 1, seconds }],
    };
  }

  for (let guard = 0; guard < s.steps.length; guard++) {
    const progress = stepProgress(s, now);
    if (!progress || progress.remaining > 0) break;
    s = closeStep(s, ms);
  }

  const step = s.steps[s.stepIndex];
  const range = s.paces[s.stepIndex];
  if (step && range && step.kind !== "recover" && ms - s.stepStartMs > 30_000 && ms - s.lastPaceCueMs > 45_000) {
    const pace = currentPace(s);
    if (pace != null) {
      // Only warn easy runners for going too fast; slow easy running is never a problem.
      const relaxed = step.zone === "easy" || step.zone === "long";
      if (pace < range.fast * 0.97) s = { ...s, lastPaceCueMs: ms, cues: [...s.cues, { type: "slowDown" }] };
      else if (!relaxed && pace > range.slow * 1.03) s = { ...s, lastPaceCueMs: ms, cues: [...s.cues, { type: "speedUp" }] };
    }
  }
  return s;
}

export function runReducer(state: RunState, event: RunEvent): RunState {
  switch (event.type) {
    case "start": {
      if (state.status !== "ready") return state;
      const cues: Cue[] = [{ type: "start" }];
      if (state.steps.length > 0) cues.push({ type: "step", index: 0 });
      return { ...state, status: "running", startedAt: event.now, segmentStart: event.now, cues: [...state.cues, ...cues] };
    }
    case "pause": {
      if (state.status !== "running") return state;
      return {
        ...state,
        status: "paused",
        bankedMs: movingMs(state, event.now),
        segmentStart: null,
        lastFix: null,
        recent: [],
        cues: [...state.cues, { type: "paused" }],
      };
    }
    case "resume": {
      if (state.status !== "paused") return state;
      return { ...state, status: "running", segmentStart: event.now, cues: [...state.cues, { type: "resumed" }] };
    }
    case "fix": {
      if (state.status !== "running") return state;
      const { fix } = event;
      const verdict = judgeFix(state.lastFix, fix);
      if (!verdict.accept) return advance(state, fix.timestamp);
      state.points.push([fix.latitude, fix.longitude, fix.timestamp, fix.altitude]);
      const distance = state.distance + verdict.distance;
      const ms = movingMs(state, fix.timestamp);
      const recent = [...state.recent, [ms, distance] as [number, number]].filter(([t]) => ms - t <= PACE_WINDOW_MS);
      return advance({ ...state, distance, lastFix: fix, recent }, fix.timestamp);
    }
    case "tick":
      return advance(state, event.now);
    case "skipStep": {
      if (state.status === "finished" || state.stepIndex >= state.steps.length) return state;
      return closeStep(state, movingMs(state, event.now));
    }
    case "finish": {
      if (state.status === "finished" || state.status === "ready") return state;
      const ms = movingMs(state, event.now);
      const partial = state.distance - state.splitStartDistance;
      const splits = partial >= 50 ? [...state.splits, { distance: partial, duration: (ms - state.splitStartMs) / 1000 }] : state.splits;
      return { ...state, status: "finished", bankedMs: ms, segmentStart: null, splits };
    }
    case "drainCues":
      return state.cues.length === 0 ? state : { ...state, cues: [] };
  }
}

export function toActivity(
  state: RunState,
  id: string,
  extra: Pick<Activity, "workoutId" | "workoutType">,
): Activity {
  return {
    id,
    startedAt: state.startedAt ?? Date.now(),
    duration: Math.round(state.bankedMs / 1000),
    distance: Math.round(state.distance),
    elevationGain: Math.round(elevationGain(state.points.map((p) => p[3]))),
    splits: state.splits,
    pointCount: state.points.length,
    stepResults: state.stepResults,
    bestEfforts: bestEfforts(state.points),
    ...extra,
  };
}
