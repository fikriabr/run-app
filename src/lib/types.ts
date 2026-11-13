import type { StrengthSlot } from "./training-types";

export type Units = "km" | "mi";
export type Language = "system" | "en" | "id";
export type ThemePreference = "system" | "light" | "dark";

export type GoalKind = "5k" | "10k" | "half" | "marathon" | "fitness";

/** Training intensity zones, each a fraction band of VDOT. */
export type Zone = "easy" | "long" | "marathon" | "threshold" | "interval" | "repetition" | "race";

export type WorkoutType =
  | "easy"
  | "recovery"
  | "long"
  | "strides"
  | "fartlek"
  | "progression"
  | "tempo"
  | "intervals"
  | "racePace"
  | "race";

export type StepKind = "warmup" | "work" | "recover" | "cooldown" | "steady";

export interface WorkoutStep {
  kind: StepKind;
  /** "distance" in metres or "time" in seconds. */
  measure: "distance" | "time";
  value: number;
  /** Pace target; recovery jogs use "easy". A standing rest has no zone. */
  zone: Zone | null;
  /** 1-based position inside a repeat block, e.g. 2 of 6. */
  rep?: { index: number; of: number };
}

export type WorkoutStatus = "planned" | "completed" | "skipped";

export interface Workout {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  week: number;
  type: WorkoutType;
  steps: WorkoutStep[];
  status: WorkoutStatus;
  activityId?: string;
}

export type Phase = "base" | "build" | "peak" | "taper" | "maintain";

export interface PlanWeek {
  index: number;
  phase: Phase;
  /** Monday of the week, YYYY-MM-DD. */
  start: string;
  targetDistance: number;
}

export interface PlanInput {
  goal: GoalKind;
  /** Weekday numbers, 0 = Monday ... 6 = Sunday. */
  runDays: number[];
  longRunDay: number;
  weeks: number;
  /** Monday the plan starts on, YYYY-MM-DD. */
  startDate: string;
  /** Optional race date; the race is placed on it when inside the last week. */
  raceDate?: string;
  vdot: number;
  /** Current typical weekly volume in metres. */
  weeklyDistance: number;
  /** Strength sessions scheduled per week, 0 to 2. */
  strengthPerWeek?: number;
}

export interface Plan {
  id: string;
  createdAt: number;
  input: PlanInput;
  weeks: PlanWeek[];
  workouts: Workout[];
  strength?: StrengthSlot[];
}

export interface Split {
  /** Distance of this split in metres; the last split may be partial. */
  distance: number;
  /** Seconds. */
  duration: number;
}

export interface Activity {
  id: string;
  startedAt: number;
  /** Moving time in seconds. */
  duration: number;
  /** Metres. */
  distance: number;
  elevationGain: number;
  splits: Split[];
  workoutId?: string;
  workoutType?: WorkoutType;
  rpe?: number;
  note?: string;
  /** Number of GPS points stored separately under the route key. */
  pointCount: number;
  stepResults?: StepResult[];
  bestEfforts?: Partial<Record<EffortKey, number>>;
}

export interface StepResult {
  index: number;
  distance: number;
  duration: number;
}

export type EffortKey = "1k" | "1mi" | "5k" | "10k" | "half" | "marathon";

/** Compact route point: [lat, lon, unix ms, altitude or null]. */
export type RoutePoint = [number, number, number, number | null];

export interface FitnessChange {
  at: number;
  from: number;
  to: number;
  reason: "setup" | "manual" | "harder" | "easier" | "fasterThanTarget" | "missedWorkouts" | "runDeleted";
}
