import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addDays } from "@/lib/dates";
import { upsertWeight } from "@/lib/nutrition";
import type { BodyProfile, FoodPrefs, MealSlot, WeightEntry } from "@/lib/nutrition-types";
import { persistStorage } from "./storage";

type DayFlags = Partial<Record<MealSlot, boolean>>;
type DaySwaps = Partial<Record<MealSlot, number>>;

interface NutritionState {
  profile: BodyProfile | null;
  prefs: FoodPrefs;
  weights: WeightEntry[];
  /** Meals ticked as eaten, by date. */
  eaten: Record<string, DayFlags>;
  /** How many times each meal was swapped, by date; shifts the pick to the next dish. */
  swaps: Record<string, DaySwaps>;

  setup: (profile: BodyProfile, prefs: FoodPrefs, weight: WeightEntry) => void;
  setPrefs: (patch: Partial<FoodPrefs>) => void;
  logWeight: (entry: WeightEntry) => void;
  removeWeight: (date: string) => void;
  toggleEaten: (date: string, slot: MealSlot) => void;
  swap: (date: string, slot: MealSlot) => void;
  reset: () => void;
}

const DEFAULT_PREFS: FoodPrefs = { cuisines: ["indonesian"], diet: [], mealsPerDay: 4 };

/** Drops day records older than two months so the store does not grow forever. */
function prune<T>(byDate: Record<string, T>, today: string): Record<string, T> {
  const cutoff = addDays(today, -60);
  return Object.fromEntries(Object.entries(byDate).filter(([d]) => d >= cutoff));
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      profile: null,
      prefs: DEFAULT_PREFS,
      weights: [],
      eaten: {},
      swaps: {},

      setup: (profile, prefs, weight) => set((s) => ({ profile, prefs, weights: upsertWeight(s.weights, weight) })),

      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),

      logWeight: (entry) => set((s) => ({ weights: upsertWeight(s.weights, entry) })),

      removeWeight: (date) => set((s) => ({ weights: s.weights.filter((w) => w.date !== date) })),

      toggleEaten: (date, slot) =>
        set((s) => ({ eaten: prune({ ...s.eaten, [date]: { ...s.eaten[date], [slot]: !s.eaten[date]?.[slot] } }, date) })),

      swap: (date, slot) =>
        set((s) => ({
          swaps: prune({ ...s.swaps, [date]: { ...s.swaps[date], [slot]: (s.swaps[date]?.[slot] ?? 0) + 1 } }, date),
          // A new dish has not been eaten yet.
          eaten: { ...s.eaten, [date]: { ...s.eaten[date], [slot]: false } },
        })),

      reset: () => set({ profile: null, prefs: DEFAULT_PREFS, weights: [], eaten: {}, swaps: {} }),
    }),
    {
      name: "langkah-nutrition",
      version: 1,
      storage: createJSONStorage(() => persistStorage),
      partialize: (s) => ({ profile: s.profile, prefs: s.prefs, weights: s.weights, eaten: s.eaten, swaps: s.swaps }),
    },
  ),
);
