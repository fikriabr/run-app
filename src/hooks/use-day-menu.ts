import { useMemo } from "react";
import { PROTEIN_BOOSTS, RECIPES } from "@/data/recipes";
import { dailyTargets, latestWeight, menuForDay, proteinBoosts, runKcal } from "@/lib/nutrition";
import { workoutDistance } from "@/lib/workouts";
import { useAppStore } from "@/store/app-store";
import { useNutritionStore } from "@/store/nutrition-store";

/** Targets, menu and protein add-ons for one day, or null before the diet is set up. */
export function useDayMenu(date: string) {
  const profile = useNutritionStore((s) => s.profile);
  const prefs = useNutritionStore((s) => s.prefs);
  const weights = useNutritionStore((s) => s.weights);
  const swaps = useNutritionStore((s) => s.swaps[date]);
  const plan = useAppStore((s) => s.plan);
  const vdot = useAppStore((s) => s.vdot);

  return useMemo(() => {
    const weight = latestWeight(weights);
    if (!profile || !weight) return null;
    const runMeters = plan
      ? plan.workouts
          .filter((w) => w.date === date && w.status !== "skipped")
          .reduce((sum, w) => sum + workoutDistance(w, vdot ?? plan.input.vdot, plan.input.goal), 0)
      : 0;
    const targets = dailyTargets(profile, weight.kg, runKcal(weight.kg, runMeters));
    const menu = menuForDay(date, targets, prefs, RECIPES, swaps);
    const boosts = proteinBoosts(targets.protein - menu.protein, PROTEIN_BOOSTS, prefs.diet);
    return { targets, menu, boosts, weight, profile, prefs };
  }, [profile, prefs, weights, swaps, plan, vdot, date]);
}
