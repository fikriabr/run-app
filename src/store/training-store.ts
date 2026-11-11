import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EXERCISE_MAP } from "@/data/exercises";
import { BUILT_IN_ROUTINE_MAP, BUILT_IN_ROUTINES } from "@/data/routines";
import { sessionExercise, sessionFromRoutine } from "@/lib/training";
import type { ExerciseVideo, Localized, LoggedSet, Routine, TrainingSession } from "@/lib/training-types";
import { persistStorage } from "./storage";

interface TrainingState {
  customRoutines: Routine[];
  sessions: TrainingSession[];
  videoOverrides: Record<string, ExerciseVideo>;

  startFromRoutine: (routineId: string, slotId?: string) => string | null;
  startEmpty: (name: Localized) => string;
  saveRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;
  finishSession: (session: TrainingSession, now: number) => TrainingSession | null;
  deleteSession: (id: string) => void;
  setVideo: (exerciseId: string, video: ExerciseVideo | null) => void;
  reset: () => void;
}

interface ActiveState {
  active: TrainingSession | null;
  restEndsAt: number | null;
  restTotal: number;
  setActive: (session: TrainingSession | null) => void;
  updateSet: (ex: number, set: number, patch: Partial<LoggedSet>) => void;
  toggleDone: (ex: number, set: number, now: number) => void;
  addSet: (ex: number) => void;
  removeSet: (ex: number, set: number) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (ex: number) => void;
  moveExercise: (ex: number, dir: -1 | 1) => void;
  adjustRest: (seconds: number) => void;
  clearRest: () => void;
  startRest: (seconds: number, now: number) => void;
  setNote: (note: string) => void;
  /** Ticks every set that has a value logged; returns how many were ticked. */
  completeExercise: (ex: number, now: number) => number;
}

function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function findRoutine(id: string | undefined, custom: Routine[]): Routine | undefined {
  if (!id) return undefined;
  return BUILT_IN_ROUTINE_MAP[id] ?? custom.find((r) => r.id === id);
}

export function allRoutines(custom: Routine[]): Routine[] {
  return [...custom, ...BUILT_IN_ROUTINES];
}

/**
 * The workout in progress lives in its own small store so every keystroke while logging
 * a set does not rewrite the whole training history to disk.
 */
export const useActiveSession = create<ActiveState>()(
  persist(
    (set) => {
      const editExercises = (fn: (exercises: TrainingSession["exercises"]) => TrainingSession["exercises"]) =>
        set((s) => (s.active ? { active: { ...s.active, exercises: fn(s.active.exercises) } } : {}));
      return {
        active: null,
        restEndsAt: null,
        restTotal: 0,
        setActive: (session) => set({ active: session, restEndsAt: null, restTotal: 0 }),
        updateSet: (ex, i, patch) =>
          editExercises((list) => list.map((e, k) => (k === ex ? { ...e, sets: e.sets.map((x, j) => (j === i ? { ...x, ...patch } : x)) } : e))),
        toggleDone: (ex, i, now) =>
          set((s) => {
            if (!s.active) return {};
            const exercise = s.active.exercises[ex];
            const target = exercise?.sets[i];
            if (!target) return {};
            const done = !target.done;
            const exercises = s.active.exercises.map((e, k) =>
              k === ex ? { ...e, sets: e.sets.map((x, j) => (j === i ? { ...x, done } : x)) } : e,
            );
            const rest = done && exercise.restSeconds > 0;
            return {
              active: { ...s.active, exercises },
              restEndsAt: rest ? now + exercise.restSeconds * 1000 : s.restEndsAt,
              restTotal: rest ? exercise.restSeconds : s.restTotal,
            };
          }),
        addSet: (ex) =>
          editExercises((list) =>
            list.map((e, k) => {
              if (k !== ex) return e;
              const last = e.sets[e.sets.length - 1];
              const copy: LoggedSet = last ? { ...last, done: false } : { reps: null, weight: null, seconds: null, done: false };
              return { ...e, sets: [...e.sets, copy] };
            }),
          ),
        removeSet: (ex, i) => editExercises((list) => list.map((e, k) => (k === ex ? { ...e, sets: e.sets.filter((_, j) => j !== i) } : e))),
        addExercise: (exerciseId) => {
          const exercise = EXERCISE_MAP[exerciseId];
          if (!exercise) return;
          const history = useTrainingStore.getState().sessions;
          const target = exercise.measure === "time" ? 30 : 10;
          editExercises((list) => [...list, sessionExercise(exercise, history, 3, target, 60)]);
        },
        removeExercise: (ex) => editExercises((list) => list.filter((_, k) => k !== ex)),
        moveExercise: (ex, dir) =>
          editExercises((list) => {
            const to = ex + dir;
            if (to < 0 || to >= list.length) return list;
            const next = [...list];
            [next[ex], next[to]] = [next[to], next[ex]];
            return next;
          }),
        adjustRest: (seconds) =>
          set((s) => (s.restEndsAt ? { restEndsAt: s.restEndsAt + seconds * 1000, restTotal: Math.max(1, s.restTotal + seconds) } : {})),
        clearRest: () => set({ restEndsAt: null, restTotal: 0 }),
        startRest: (seconds, now) => set({ restEndsAt: now + seconds * 1000, restTotal: seconds }),
        setNote: (note) => set((s) => (s.active ? { active: { ...s.active, note } } : {})),
        completeExercise: (ex, now) => {
          let ticked = 0;
          set((s) => {
            if (!s.active) return {};
            const exercise = s.active.exercises[ex];
            if (!exercise) return {};
            const sets = exercise.sets.map((x) => {
              const hasValue = (x.reps ?? 0) > 0 || (x.seconds ?? 0) > 0;
              if (!x.done && hasValue) ticked++;
              return hasValue ? { ...x, done: true } : x;
            });
            const exercises = s.active.exercises.map((e, k) => (k === ex ? { ...e, sets } : e));
            const rest = ticked > 0 && exercise.restSeconds > 0;
            return {
              active: { ...s.active, exercises },
              restEndsAt: rest ? now + exercise.restSeconds * 1000 : s.restEndsAt,
              restTotal: rest ? exercise.restSeconds : s.restTotal,
            };
          });
          return ticked;
        },
      };
    },
    { name: "langkah-active-session", version: 1, storage: createJSONStorage(() => persistStorage) },
  ),
);

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      customRoutines: [],
      sessions: [],
      videoOverrides: {},

      startFromRoutine: (routineId, slotId) => {
        const routine = findRoutine(routineId, get().customRoutines);
        if (!routine) return null;
        const session = sessionFromRoutine(routine, EXERCISE_MAP, get().sessions, newId("t"), Date.now(), slotId);
        useActiveSession.getState().setActive(session);
        return session.id;
      },

      startEmpty: (name) => {
        const session: TrainingSession = { id: newId("t"), name, startedAt: Date.now(), exercises: [] };
        useActiveSession.getState().setActive(session);
        return session.id;
      },

      saveRoutine: (routine) =>
        set((s) => ({
          customRoutines: s.customRoutines.some((r) => r.id === routine.id)
            ? s.customRoutines.map((r) => (r.id === routine.id ? routine : r))
            : [routine, ...s.customRoutines],
        })),

      deleteRoutine: (id) => set((s) => ({ customRoutines: s.customRoutines.filter((r) => r.id !== id) })),

      finishSession: (session, now) => {
        // Only completed sets are history; exercises with none are dropped.
        const exercises = session.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
          .filter((e) => e.sets.length > 0);
        if (exercises.length === 0) return null;
        const saved: TrainingSession = { ...session, exercises, finishedAt: now };
        set((s) => ({ sessions: [saved, ...s.sessions].sort((a, b) => b.startedAt - a.startedAt) }));
        return saved;
      },

      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      setVideo: (exerciseId, video) =>
        set((s) => {
          const videoOverrides = { ...s.videoOverrides };
          if (video) videoOverrides[exerciseId] = video;
          else delete videoOverrides[exerciseId];
          return { videoOverrides };
        }),

      reset: () => {
        set({ customRoutines: [], sessions: [], videoOverrides: {} });
        useActiveSession.getState().setActive(null);
      },
    }),
    {
      name: "langkah-training",
      version: 1,
      storage: createJSONStorage(() => persistStorage),
      partialize: (s) => ({ customRoutines: s.customRoutines, sessions: s.sessions, videoOverrides: s.videoOverrides }),
    },
  ),
);

export { newId as newTrainingId };
