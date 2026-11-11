/** A string in both app languages. */
export interface Localized {
  en: string;
  id: string;
}

export type ExerciseCategory = "strength" | "core" | "plyometric" | "yoga" | "diastasis" | "mobility";

export type Equipment = "none" | "dumbbell" | "band" | "box" | "mat" | "wall" | "bench";

export type Muscle =
  | "quads"
  | "glutes"
  | "hamstrings"
  | "calves"
  | "hips"
  | "core"
  | "obliques"
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "spine"
  | "pelvicFloor";

export interface ExerciseVideo {
  /** YouTube video id. */
  id: string;
  /** Title as listed on YouTube, so the runner knows whose tutorial it is. */
  title: string;
  /** Seconds into the video where the looped demo starts. */
  start?: number;
  /** Seconds into the video where the looped demo ends and jumps back to start. */
  end?: number;
}

export interface Exercise {
  id: string;
  category: ExerciseCategory;
  name: Localized;
  equipment: Equipment[];
  muscles: Muscle[];
  /** Whether sets are counted in reps or held for seconds. */
  measure: "reps" | "time";
  /** Targets apply to each side, e.g. 10 reps per leg. */
  perSide: boolean;
  /** Sets can carry a load in kilograms. */
  weighted: boolean;
  steps: { en: string[]; id: string[] };
  tip?: Localized;
  caution?: Localized;
  video?: ExerciseVideo;
}

export interface RoutineItem {
  exerciseId: string;
  sets: number;
  /** Reps, or seconds when the exercise is timed. */
  target: number;
  restSeconds: number;
}

export interface Routine {
  id: string;
  category: ExerciseCategory;
  name: Localized;
  description?: Localized;
  items: RoutineItem[];
  builtIn: boolean;
}

export interface LoggedSet {
  reps: number | null;
  /** Kilograms; null for bodyweight. */
  weight: number | null;
  seconds: number | null;
  done: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  restSeconds: number;
  sets: LoggedSet[];
}

export interface TrainingSession {
  id: string;
  name: Localized;
  routineId?: string;
  /** Plan strength slot this session fulfils. */
  slotId?: string;
  startedAt: number;
  finishedAt?: number;
  exercises: SessionExercise[];
  note?: string;
}

export interface StrengthSlot {
  id: string;
  /** YYYY-MM-DD. */
  date: string;
  week: number;
  routineId: string;
  status: "planned" | "completed" | "skipped";
  sessionId?: string;
}
