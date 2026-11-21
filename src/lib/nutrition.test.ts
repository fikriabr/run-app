import { describe, expect, it } from "vitest";
import { PROTEIN_BOOSTS, RECIPES } from "../data/recipes";
import {
  allowedByDiet,
  bmr,
  dailyTargets,
  formatServings,
  menuForDay,
  proteinBoosts,
  recipesFor,
  servingsFor,
  upsertWeight,
  weeksToTarget,
  weightChange,
} from "./nutrition";
import type { BodyProfile, Cuisine, FoodPrefs } from "./nutrition-types";
import { addDays } from "./dates";

const man: BodyProfile = { sex: "male", age: 30, heightCm: 175, activity: "light", goal: "lose", targetKg: 72 };
const CUISINES: Cuisine[] = ["indonesian", "western", "chinese", "japanese", "korean", "indian", "mediterranean"];

describe("targets", () => {
  it("uses Mifflin-St Jeor", () => {
    expect(bmr(man, 80)).toBe(1749);
    expect(bmr({ ...man, sex: "female" }, 60)).toBe(Math.round(10 * 60 + 6.25 * 175 - 150 - 161));
  });

  it("puts a weight-loss day in a moderate deficit with high protein", () => {
    const t = dailyTargets(man, 80);
    expect(t.kcal).toBeLessThan(t.tdee);
    expect(t.tdee - t.kcal).toBeLessThanOrEqual(510);
    expect(t.kcal).toBeGreaterThanOrEqual(t.bmr - 10);
    expect(t.protein).toBe(160);
    expect(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal)).toBeLessThan(15);
  });

  it("never drops below the calorie floor", () => {
    const small: BodyProfile = { sex: "female", age: 50, heightCm: 150, activity: "low", goal: "lose" };
    expect(dailyTargets(small, 48).kcal).toBeGreaterThanOrEqual(1200);
  });

  it("caps protein for heavier bodies and adds run calories", () => {
    const t = dailyTargets({ ...man, goal: "maintain" }, 120);
    expect(t.protein).toBeLessThan(120 * 1.6);
    const runDay = dailyTargets(man, 80, 600);
    expect(runDay.kcal - dailyTargets(man, 80).kcal).toBe(600);
  });

  it("estimates weeks to target at a safe pace", () => {
    expect(weeksToTarget(80, 72, "lose")).toBe(16);
    expect(weeksToTarget(60, 62, "gain")).toBe(8);
    expect(weeksToTarget(80, 72, "maintain")).toBeNull();
  });
});

describe("recipes", () => {
  it("are complete, bilingual and add up", () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    for (const r of RECIPES) {
      expect(r.ingredients.id.length, r.id).toBe(r.ingredients.en.length);
      expect(r.steps.id.length, r.id).toBe(r.steps.en.length);
      const fromMacros = r.protein * 4 + r.carbs * 4 + r.fat * 9;
      expect(Math.abs(fromMacros - r.kcal) / r.kcal, `${r.id} macros vs kcal`).toBeLessThan(0.15);
      for (const text of [...r.steps.en, ...r.steps.id, ...r.ingredients.en, ...r.ingredients.id]) expect(text).not.toContain("—");
    }
  });

  it("cover every meal in every cuisine", () => {
    for (const c of CUISINES) {
      for (const slot of ["breakfast", "lunch", "dinner"] as const) {
        expect(recipesFor(RECIPES, slot, [c], []).filter((r) => r.cuisine === c).length, `${c} ${slot}`).toBeGreaterThan(0);
      }
    }
  });

  it("respects diet choices", () => {
    const veg = recipesFor(RECIPES, null, [], ["vegetarian"]);
    expect(veg.length).toBeGreaterThan(5);
    for (const r of veg) expect(r.contains.some((t) => ["pork", "beef", "poultry", "fish", "seafood"].includes(t))).toBe(false);
    expect(allowedByDiet({ contains: ["pork"] }, ["noPork"])).toBe(false);
    expect(allowedByDiet({ contains: ["pork"] }, ["noBeef"])).toBe(true);
  });
});

describe("menuForDay", () => {
  const prefs: FoodPrefs = { cuisines: ["indonesian"], diet: ["noPork"], mealsPerDay: 4 };
  const targets = { kcal: 2200, protein: 150 };

  it("plans every meal from the chosen menu and lands near the calorie target", () => {
    const day = menuForDay("2026-11-23", targets, prefs, RECIPES);
    expect(day.meals.map((m) => m.slot)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
    for (const m of day.meals) expect(["indonesian", "any"]).toContain(m.recipe.cuisine);
    expect(Math.abs(day.kcal - targets.kcal) / targets.kcal).toBeLessThan(0.2);
    expect(new Set(day.meals.map((m) => m.recipe.id)).size).toBe(day.meals.length);
  });

  it("is stable for a date, varies across days and changes a meal on swap", () => {
    const a = menuForDay("2026-11-23", targets, prefs, RECIPES);
    expect(menuForDay("2026-11-23", targets, prefs, RECIPES)).toEqual(a);
    const week = [0, 1, 2, 3, 4, 5, 6].map((d) => menuForDay(addDays("2026-11-23", d), targets, prefs, RECIPES).meals[1].recipe.id);
    expect(new Set(week).size).toBeGreaterThan(2);
    const swapped = menuForDay("2026-11-23", targets, prefs, RECIPES, { lunch: 1 });
    expect(swapped.meals[1].recipe.id).not.toBe(a.meals[1].recipe.id);
  });

  it("falls back to any cuisine when the chosen menu has nothing allowed for a meal", () => {
    const day = menuForDay("2026-11-23", targets, { cuisines: ["chinese"], diet: ["vegetarian", "noDairy"], mealsPerDay: 3 }, RECIPES);
    expect(day.meals).toHaveLength(3);
  });

  it("keeps portions between half and double", () => {
    expect(servingsFor(1000, 400)).toBe(2);
    expect(servingsFor(100, 400)).toBe(0.5);
    expect(servingsFor(600, 400)).toBe(1.5);
    expect([0.5, 1, 1.25, 2].map(formatServings)).toEqual(["½", "1", "1¼", "2"]);
  });
});

describe("protein boosts and weight", () => {
  it("suggests boosts only for a real gap and within the diet", () => {
    expect(proteinBoosts(5, PROTEIN_BOOSTS, [])).toEqual([]);
    const vegan = proteinBoosts(30, PROTEIN_BOOSTS, ["vegetarian", "noDairy"]);
    expect(vegan.length).toBeGreaterThan(0);
    for (const b of vegan) expect(b.contains.some((t) => ["dairy", "poultry", "fish"].includes(t))).toBe(false);
  });

  it("logs one weight per day and reports change", () => {
    let w = upsertWeight([], { date: "2026-11-01", kg: 80 });
    w = upsertWeight(w, { date: "2026-11-20", kg: 78.6 });
    w = upsertWeight(w, { date: "2026-11-20", kg: 78.4 });
    expect(w).toHaveLength(2);
    expect(weightChange(w, "2026-11-20", 14)).toBe(-1.6);
    expect(weightChange(w, "2026-11-20", 60)).toBeNull();
  });
});
