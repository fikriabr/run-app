import type { Exercise, LoggedSet, Routine, SessionExercise, TrainingSession } from "./training-types";

export function emptySet(exercise: Pick<Exercise, "measure">, target: number | null, weight: number | null): LoggedSet {
  return {
    reps: exercise.measure === "reps" ? target : null,
    seconds: exercise.measure === "time" ? target : null,
    weight,
    done: false,
  };
}

/** Sets from the most recent finished session that contains the exercise. */
export function previousSets(history: TrainingSession[], exerciseId: string): LoggedSet[] {
  const latest = [...history]
    .filter((s) => s.finishedAt != null)
    .sort((a, b) => b.startedAt - a.startedAt)
    .find((s) => s.exercises.some((e) => e.exerciseId === exerciseId && e.sets.some((x) => x.done)));
  return latest?.exercises.find((e) => e.exerciseId === exerciseId)?.sets.filter((x) => x.done) ?? [];
}

/** Builds a session from a routine, carrying over last session's weights so the runner starts where they left off. */
export function sessionFromRoutine(
  routine: Routine,
  exercises: Record<string, Exercise>,
  history: TrainingSession[],
  id: string,
  now: number,
  slotId?: string,
): TrainingSession {
  return {
    id,
    name: routine.name,
    routineId: routine.id,
    slotId,
    startedAt: now,
    exercises: routine.items
      .filter((item) => exercises[item.exerciseId])
      .map((item) => sessionExercise(exercises[item.exerciseId], history, item.sets, item.target, item.restSeconds)),
  };
}

export function sessionExercise(
  exercise: Exercise,
  history: TrainingSession[],
  sets: number,
  target: number | null,
  restSeconds: number,
): SessionExercise {
  const previous = previousSets(history, exercise.id);
  return {
    exerciseId: exercise.id,
    restSeconds,
    sets: Array.from({ length: sets }, (_, i) => {
      const prev = previous[Math.min(i, previous.length - 1)];
      return emptySet(exercise, target, exercise.weighted ? (prev?.weight ?? null) : null);
    }),
  };
}

export interface SessionStats {
  doneSets: number;
  totalSets: number;
  reps: number;
  seconds: number;
  /** Sum of weight x reps over completed weighted sets, in kg. */
  volume: number;
  duration: number;
}

export function sessionStats(session: TrainingSession, now: number = Date.now()): SessionStats {
  let doneSets = 0;
  let totalSets = 0;
  let reps = 0;
  let seconds = 0;
  let volume = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      totalSets++;
      if (!set.done) continue;
      doneSets++;
      reps += set.reps ?? 0;
      seconds += set.seconds ?? 0;
      if (set.weight && set.reps) volume += set.weight * set.reps;
    }
  }
  const end = session.finishedAt ?? now;
  return { doneSets, totalSets, reps, seconds, volume, duration: Math.max(0, Math.round((end - session.startedAt) / 1000)) };
}

/** Epley estimate of a one-rep max; only meaningful up to roughly 12 reps. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export interface ExerciseBests {
  heaviest: number | null;
  oneRepMax: number | null;
  mostReps: number | null;
  longestHold: number | null;
  sessions: number;
}

export function exerciseBests(history: TrainingSession[], exerciseId: string): ExerciseBests {
  const bests: ExerciseBests = { heaviest: null, oneRepMax: null, mostReps: null, longestHold: null, sessions: 0 };
  for (const session of history) {
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex || !ex.sets.some((s) => s.done)) continue;
    bests.sessions++;
    for (const set of ex.sets) {
      if (!set.done) continue;
      if (set.weight) bests.heaviest = Math.max(bests.heaviest ?? 0, set.weight);
      if (set.weight && set.reps && set.reps <= 12) {
        bests.oneRepMax = Math.max(bests.oneRepMax ?? 0, estimateOneRepMax(set.weight, set.reps));
      }
      if (set.reps) bests.mostReps = Math.max(bests.mostReps ?? 0, set.reps);
      if (set.seconds) bests.longestHold = Math.max(bests.longestHold ?? 0, set.seconds);
    }
  }
  return bests;
}

/** Completed sets of an exercise per session, newest first. */
export function exerciseHistory(history: TrainingSession[], exerciseId: string): { sessionId: string; at: number; sets: LoggedSet[] }[] {
  return history
    .filter((s) => s.finishedAt != null)
    .map((s) => ({ sessionId: s.id, at: s.startedAt, sets: s.exercises.find((e) => e.exerciseId === exerciseId)?.sets.filter((x) => x.done) ?? [] }))
    .filter((h) => h.sets.length > 0)
    .sort((a, b) => b.at - a.at);
}

/** Pulls the 11-character video id out of any common YouTube link, or accepts a bare id. */
export function parseYouTubeId(input: string): string | null {
  const text = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Rough routine length: work time plus rests, using 3 s per rep. */
export function routineDuration(routine: Routine, exercises: Record<string, Exercise>): number {
  let total = 0;
  for (const item of routine.items) {
    const ex = exercises[item.exerciseId];
    if (!ex) continue;
    const sides = ex.perSide ? 2 : 1;
    const work = ex.measure === "time" ? item.target : item.target * 3;
    total += item.sets * work * sides + Math.max(0, item.sets - 1) * item.restSeconds + 30;
  }
  return total;
}

export const KG_PER_LB = 0.45359237;

export function toDisplayWeight(kg: number, unit: "kg" | "lb"): number {
  const value = unit === "kg" ? kg : kg / KG_PER_LB;
  return Math.round(value * 10) / 10;
}

export function fromDisplayWeight(value: number, unit: "kg" | "lb"): number {
  return unit === "kg" ? value : value * KG_PER_LB;
}

/** A ticked set beats every earlier session: heavier, or more reps at bodyweight, or a longer hold. Needs history to compare against. */
export function isPersonalBest(set: LoggedSet, bests: ExerciseBests): boolean {
  if (!set.done || bests.sessions === 0) return false;
  if (set.weight && set.weight > (bests.heaviest ?? 0)) return true;
  if (!set.weight && set.reps && bests.heaviest == null && set.reps > (bests.mostReps ?? 0)) return true;
  if (set.seconds && set.seconds > (bests.longestHold ?? 0)) return true;
  return false;
}


/** Reads a start time from a YouTube link: t=75, t=1m15s, t=1h2m3s or start=75. */
export function parseYouTubeStart(input: string): number | null {
  const m = input.match(/[?&#](?:t|start)=([0-9hms]+)/);
  if (!m) return null;
  const value = m[1];
  if (/^\d+s?$/.test(value)) return Number(value.replace("s", ""));
  const parts = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!parts || value === "") return null;
  const seconds = Number(parts[1] ?? 0) * 3600 + Number(parts[2] ?? 0) * 60 + Number(parts[3] ?? 0);
  return seconds > 0 ? seconds : null;
}

/** Accepts "75", "1:15" or "1:02:03" as seconds into a video; null when malformed. */
export function parseVideoTime(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.slice(1).some((n) => n >= 60)) return null;
  return nums.length === 3 ? nums[0] * 3600 + nums[1] * 60 + nums[2] : nums[0] * 60 + nums[1];
}

/** "1:15" for a time inside a video. */
export function formatVideoTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
