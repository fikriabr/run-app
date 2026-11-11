import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applyAdjustment, assessWorkout, moveWorkout } from "@/lib/adapt";
import { generatePlan } from "@/lib/plan-generator";
import { scheduleStrength } from "@/lib/strength-schedule";
import type { Activity, FitnessChange, Language, Plan, PlanInput, RoutePoint, ThemePreference, Units, WorkoutStatus } from "@/lib/types";
import { clampVdot } from "@/lib/vdot";
import type { StrengthSlot } from "@/lib/training-types";
import { clearAllStorage, deleteRoute, persistStorage, saveRoute } from "./storage";

export interface Settings {
  units: Units;
  language: Language;
  theme: ThemePreference;
  voice: boolean;
  splitCues: boolean;
  paceCues: boolean;
  /** Exercise demo videos start muted and loop; undefined in older saves means on. */
  autoplayVideo?: boolean;
}

export type SavedActivity = Activity & { fitnessChange?: Pick<FitnessChange, "from" | "to" | "reason"> };

interface AppState {
  settings: Settings;
  vdot: number | null;
  fitnessHistory: FitnessChange[];
  plan: Plan | null;
  activities: SavedActivity[];
  /** Date (YYYY-MM-DD) until which the missed-runs prompt stays hidden. */
  missedPromptHiddenUntil: string | null;

  updateSettings: (patch: Partial<Settings>) => void;
  createPlan: (input: PlanInput, skipBefore?: string) => void;
  setWorkoutStatus: (workoutId: string, status: WorkoutStatus) => void;
  moveWorkout: (workoutId: string, date: string) => void;
  setStrengthSlot: (slotId: string, patch: Partial<Pick<StrengthSlot, "status" | "sessionId" | "date">>) => void;
  setVdot: (vdot: number, reason: FitnessChange["reason"]) => void;
  hideMissedPrompt: (until: string) => void;
  saveActivity: (activity: Activity, points: RoutePoint[], rpe: number | null, note: string) => SavedActivity;
  deleteActivity: (id: string) => void;
  resetAll: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  units: "km",
  language: "system",
  theme: "system",
  voice: true,
  splitCues: true,
  paceCues: true,
  autoplayVideo: true,
};

function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      vdot: null,
      fitnessHistory: [],
      plan: null,
      activities: [],
      missedPromptHiddenUntil: null,

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      createPlan: (input, skipBefore) => {
        const base = generatePlan(input, { planId: newId("p"), skipBefore });
        const plan = { ...base, strength: scheduleStrength(base, input.strengthPerWeek ?? 0, skipBefore) };
        const previous = get().vdot;
        set((s) => ({
          plan,
          vdot: input.vdot,
          missedPromptHiddenUntil: null,
          fitnessHistory:
            previous === input.vdot
              ? s.fitnessHistory
              : [{ at: Date.now(), from: previous ?? input.vdot, to: input.vdot, reason: "setup" }, ...s.fitnessHistory],
        }));
      },

      setWorkoutStatus: (workoutId, status) =>
        set((s) =>
          s.plan
            ? {
                plan: {
                  ...s.plan,
                  workouts: s.plan.workouts.map((w) =>
                    w.id === workoutId ? { ...w, status, activityId: status === "completed" ? w.activityId : undefined } : w,
                  ),
                },
              }
            : {},
        ),

      setStrengthSlot: (slotId, patch) =>
        set((s) =>
          s.plan?.strength
            ? { plan: { ...s.plan, strength: s.plan.strength.map((x) => (x.id === slotId ? { ...x, ...patch } : x)) } }
            : {},
        ),

      moveWorkout: (workoutId, date) => set((s) => (s.plan ? { plan: moveWorkout(s.plan, workoutId, date) } : {})),

      setVdot: (vdot, reason) => {
        const from = get().vdot ?? vdot;
        const to = clampVdot(Math.round(vdot * 10) / 10);
        if (to === from) return;
        set((s) => ({
          vdot: to,
          plan: s.plan ? { ...s.plan, input: { ...s.plan.input, vdot: to } } : s.plan,
          fitnessHistory: [{ at: Date.now(), from, to, reason }, ...s.fitnessHistory].slice(0, 50),
        }));
      },

      hideMissedPrompt: (until) => set({ missedPromptHiddenUntil: until }),

      saveActivity: (activity, points, rpe, note) => {
        const { plan, vdot } = get();
        const workout = activity.workoutId ? plan?.workouts.find((w) => w.id === activity.workoutId) : undefined;
        let saved: SavedActivity = { ...activity, rpe: rpe ?? undefined, note: note.trim() || undefined };

        if (workout && plan && vdot != null && rpe != null) {
          const adjustment = assessWorkout(workout, activity, rpe, vdot, plan.input.goal);
          if (adjustment) {
            const to = applyAdjustment(vdot, adjustment);
            if (to !== vdot) {
              saved = { ...saved, fitnessChange: { from: vdot, to, reason: adjustment.reason } };
              get().setVdot(to, adjustment.reason);
            }
          }
        }

        saveRoute(saved.id, points);
        set((s) => ({
          activities: [saved, ...s.activities].sort((a, b) => b.startedAt - a.startedAt),
          plan:
            workout && s.plan
              ? {
                  ...s.plan,
                  workouts: s.plan.workouts.map((w) =>
                    w.id === workout.id ? { ...w, status: "completed" as const, activityId: saved.id } : w,
                  ),
                }
              : s.plan,
        }));
        return saved;
      },

      deleteActivity: (id) => {
        deleteRoute(id);
        set((s) => ({
          activities: s.activities.filter((a) => a.id !== id),
          plan: s.plan
            ? {
                ...s.plan,
                workouts: s.plan.workouts.map((w) =>
                  w.activityId === id ? { ...w, status: "planned" as const, activityId: undefined } : w,
                ),
              }
            : s.plan,
        }));
      },

      resetAll: () => {
        clearAllStorage();
        set({
          settings: DEFAULT_SETTINGS,
          vdot: null,
          fitnessHistory: [],
          plan: null,
          activities: [],
          missedPromptHiddenUntil: null,
        });
      },
    }),
    {
      name: "langkah-store",
      version: 1,
      storage: createJSONStorage(() => persistStorage),
      partialize: (s) => ({
        settings: s.settings,
        vdot: s.vdot,
        fitnessHistory: s.fitnessHistory,
        plan: s.plan,
        activities: s.activities,
        missedPromptHiddenUntil: s.missedPromptHiddenUntil,
      }),
    },
  ),
);

export { newId };
