import type { GoalKind, StepKind, Workout, WorkoutStep, WorkoutType, Zone } from "./types";
import { zoneMidPace } from "./vdot";

export function distanceStep(kind: StepKind, meters: number, zone: Zone | null): WorkoutStep {
  return { kind, measure: "distance", value: Math.round(meters / 100) * 100, zone };
}

export function timeStep(kind: StepKind, seconds: number, zone: Zone | null): WorkoutStep {
  return { kind, measure: "time", value: Math.round(seconds), zone };
}

/** Expands `reps` x (work, recovery) into flat steps; the final recovery is dropped. */
export function repeat(reps: number, work: WorkoutStep, recovery: WorkoutStep | null): WorkoutStep[] {
  const steps: WorkoutStep[] = [];
  for (let i = 1; i <= reps; i++) {
    steps.push({ ...work, rep: { index: i, of: reps } });
    if (recovery && i < reps) steps.push({ ...recovery, rep: { index: i, of: reps } });
  }
  return steps;
}

// Standing rests are walked or jogged very slowly; 9:00 /km keeps distance estimates honest.
const REST_PACE = 540;

export function stepPace(step: WorkoutStep, vdot: number, goal: GoalKind): number {
  return step.zone ? zoneMidPace(vdot, step.zone, goal) : REST_PACE;
}

export function stepDistance(step: WorkoutStep, vdot: number, goal: GoalKind): number {
  if (step.measure === "distance") return step.value;
  return (step.value / stepPace(step, vdot, goal)) * 1000;
}

export function stepDuration(step: WorkoutStep, vdot: number, goal: GoalKind): number {
  if (step.measure === "time") return step.value;
  return (step.value / 1000) * stepPace(step, vdot, goal);
}

export function workoutDistance(workout: Pick<Workout, "steps">, vdot: number, goal: GoalKind): number {
  return workout.steps.reduce((sum, s) => sum + stepDistance(s, vdot, goal), 0);
}

export function workoutDuration(workout: Pick<Workout, "steps">, vdot: number, goal: GoalKind): number {
  return workout.steps.reduce((sum, s) => sum + stepDuration(s, vdot, goal), 0);
}

const QUALITY_TYPES: WorkoutType[] = ["tempo", "intervals", "racePace", "race", "fartlek", "progression"];

export function isQuality(type: WorkoutType): boolean {
  return QUALITY_TYPES.includes(type);
}

/** Effort tone used for colour: "hard" sessions get the track accent, the rest the field green. */
export function effortTone(type: WorkoutType): "hard" | "steady" {
  return isQuality(type) ? "hard" : "steady";
}

/** RPE a well-judged session of this type should feel like, on a 1-10 scale. */
export const EXPECTED_RPE: Record<WorkoutType, number> = {
  recovery: 2,
  easy: 3,
  strides: 4,
  long: 5,
  progression: 6,
  fartlek: 6,
  tempo: 7,
  racePace: 7,
  intervals: 8,
  race: 9,
};

/** Relative intensity 0..1 for drawing lane-chart block heights. */
export function zoneIntensity(zone: Zone | null): number {
  switch (zone) {
    case null:
      return 0.12;
    case "easy":
      return 0.35;
    case "long":
      return 0.4;
    case "marathon":
      return 0.6;
    case "threshold":
      return 0.72;
    case "race":
      return 0.85;
    case "interval":
      return 0.9;
    case "repetition":
      return 1;
  }
}
