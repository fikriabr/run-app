import { addDays } from "./dates";
import type { ActivityLevel, BodyProfile, Cuisine, DietFlag, FoodPrefs, FoodTag, MealSlot, ProteinBoost, Recipe, WeightEntry } from "./nutrition-types";

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = { low: 1.2, light: 1.375, moderate: 1.55, high: 1.725 };

/** Protein per kilogram of reference body weight, by goal. Higher when losing, to keep muscle. */
const PROTEIN_PER_KG = { lose: 2.0, maintain: 1.6, gain: 1.8 } as const;
const KCAL_FLOOR = { male: 1500, female: 1200 } as const;

export interface DailyTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  tdee: number;
  /** Calories added for a planned run that day. */
  runKcal: number;
}

/** Mifflin-St Jeor resting energy, kcal per day. */
export function bmr(profile: Pick<BodyProfile, "sex" | "age" | "heightCm">, kg: number): number {
  const base = 10 * kg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(base + (profile.sex === "male" ? 5 : -161));
}

export function bmi(kg: number, heightCm: number): number {
  const m = heightCm / 100;
  return kg / (m * m);
}

/** Running costs roughly 1 kcal per kg per km, whatever the pace. */
export function runKcal(kg: number, meters: number): number {
  return Math.round((kg * meters) / 1000);
}

/**
 * Calories and macros for one day. Protein is set from body weight, capped at the weight of a
 * BMI of 27 so it stays realistic for heavier bodies; fat takes 28% of calories and carbs the rest.
 */
export function dailyTargets(profile: BodyProfile, kg: number, extraKcal = 0): DailyTargets {
  const rest = bmr(profile, kg);
  const tdee = Math.round(rest * ACTIVITY_FACTOR[profile.activity]);
  let base = tdee;
  if (profile.goal === "lose") base = Math.max(KCAL_FLOOR[profile.sex], rest, tdee - Math.min(500, tdee * 0.2));
  if (profile.goal === "gain") base = tdee + 250;
  const kcal = Math.round((base + extraKcal) / 10) * 10;
  const refKg = Math.min(kg, 27 * (profile.heightCm / 100) ** 2);
  const protein = Math.round((refKg * PROTEIN_PER_KG[profile.goal]) / 5) * 5;
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, bmr: rest, tdee, runKcal: extraKcal };
}

/** Weeks to reach the target at a safe pace: 0.5 kg a week down, 0.25 kg a week up. */
export function weeksToTarget(kg: number, targetKg: number | undefined, goal: BodyProfile["goal"]): number | null {
  if (targetKg == null || goal === "maintain") return null;
  const diff = goal === "lose" ? kg - targetKg : targetKg - kg;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (goal === "lose" ? 0.5 : 0.25));
}

const EXCLUDED_BY: Record<DietFlag, FoodTag[]> = {
  vegetarian: ["pork", "beef", "poultry", "fish", "seafood"],
  noPork: ["pork"],
  noBeef: ["beef"],
  noSeafood: ["fish", "seafood"],
  noDairy: ["dairy"],
};

export function allowedByDiet(item: { contains: FoodTag[] }, diet: DietFlag[]): boolean {
  return diet.every((flag) => !EXCLUDED_BY[flag].some((tag) => item.contains.includes(tag)));
}

export function recipesFor(recipes: Recipe[], slot: MealSlot | null, cuisines: Cuisine[], diet: DietFlag[]): Recipe[] {
  return recipes.filter(
    (r) =>
      (slot == null || r.slots.includes(slot)) &&
      (cuisines.length === 0 || r.cuisine === "any" || cuisines.includes(r.cuisine)) &&
      allowedByDiet(r, diet),
  );
}

export function slotsFor(mealsPerDay: 3 | 4): MealSlot[] {
  return mealsPerDay === 4 ? ["breakfast", "lunch", "dinner", "snack"] : ["breakfast", "lunch", "dinner"];
}

/** Share of the day's calories each meal gets. */
export function slotShare(slot: MealSlot, mealsPerDay: 3 | 4): number {
  const shares = mealsPerDay === 4 ? { breakfast: 0.25, lunch: 0.32, dinner: 0.28, snack: 0.15 } : { breakfast: 0.3, lunch: 0.38, dinner: 0.32, snack: 0 };
  return shares[slot];
}

/** Portion size in quarter servings between half and double, so plates stay normal. */
export function servingsFor(targetKcal: number, recipeKcal: number): number {
  const raw = targetKcal / recipeKcal;
  return Math.min(2, Math.max(0.5, Math.round(raw * 4) / 4));
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface PlannedMeal {
  slot: MealSlot;
  recipe: Recipe;
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayMenu {
  meals: PlannedMeal[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Picks one recipe per meal for a date. The choice is stable for a date, rotates through the
 * menu over the days, favours protein-dense dishes when the protein target is high, and avoids
 * the same dish twice in a day. `swaps` moves a meal to the next candidate.
 */
export function menuForDay(
  date: string,
  targets: Pick<DailyTargets, "kcal" | "protein">,
  prefs: FoodPrefs,
  recipes: Recipe[],
  swaps: Partial<Record<MealSlot, number>> = {},
): DayMenu {
  const slots = slotsFor(prefs.mealsPerDay);
  const proteinShare = (targets.protein * 4) / targets.kcal;
  const used = new Set<string>();
  const dayNumber = Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 86_400_000);
  const meals: PlannedMeal[] = [];

  for (const slot of slots) {
    let pool = recipesFor(recipes, slot, prefs.cuisines, prefs.diet);
    if (pool.length === 0) pool = recipesFor(recipes, slot, [], prefs.diet);
    if (pool.length === 0) continue;
    const ranked = [...pool].sort((a, b) => b.protein / b.kcal - a.protein / a.kcal || a.id.localeCompare(b.id));
    // A high protein target keeps the leaner, protein-rich two thirds of the menu in rotation.
    const top = proteinShare >= 0.22 && ranked.length > 3 ? ranked.slice(0, Math.max(3, Math.ceil(ranked.length * 0.66))) : ranked;
    const start = (dayNumber + (hash(slot) % top.length) + (swaps[slot] ?? 0)) % top.length;
    let recipe = top[start];
    for (let i = 1; i < top.length && used.has(recipe.id); i++) recipe = top[(start + i) % top.length];
    used.add(recipe.id);
    const servings = servingsFor(targets.kcal * slotShare(slot, prefs.mealsPerDay), recipe.kcal);
    meals.push({
      slot,
      recipe,
      servings,
      kcal: Math.round(recipe.kcal * servings),
      protein: Math.round(recipe.protein * servings),
      carbs: Math.round(recipe.carbs * servings),
      fat: Math.round(recipe.fat * servings),
    });
  }
  const sum = (key: "kcal" | "protein" | "carbs" | "fat") => meals.reduce((s, m) => s + m[key], 0);
  return { meals, kcal: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") };
}

/** Simple add-ons that close a protein gap, smallest first, honouring diet choices. */
export function proteinBoosts(gap: number, boosts: ProteinBoost[], diet: DietFlag[], max = 2): ProteinBoost[] {
  if (gap < 10) return [];
  const allowed = boosts.filter((b) => allowedByDiet(b, diet)).sort((a, b) => b.protein / b.kcal - a.protein / a.kcal);
  const picked: ProteinBoost[] = [];
  let left = gap;
  for (const b of allowed) {
    if (picked.length >= max || left < 5) break;
    picked.push(b);
    left -= b.protein;
  }
  return picked;
}

export function latestWeight(entries: WeightEntry[]): WeightEntry | undefined {
  return entries.reduce<WeightEntry | undefined>((best, e) => (!best || e.date > best.date ? e : best), undefined);
}

/** Weight change over the last `days`, comparing the newest entry with the newest one before that window. */
export function weightChange(entries: WeightEntry[], today: string, days: number): number | null {
  const last = latestWeight(entries);
  if (!last) return null;
  const cutoff = addDays(today, -days);
  const before = entries.filter((e) => e.date <= cutoff).sort((a, b) => b.date.localeCompare(a.date))[0];
  return before ? Math.round((last.kg - before.kg) * 10) / 10 : null;
}

/** Inserts or replaces the entry for a date, keeping the list sorted oldest first. */
export function upsertWeight(entries: WeightEntry[], entry: WeightEntry): WeightEntry[] {
  return [...entries.filter((e) => e.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date));
}

/** "½", "1", "1½" and so on, for quarter-step portion sizes. */
export function formatServings(servings: number): string {
  const whole = Math.floor(servings);
  const part = { 0: "", 0.25: "¼", 0.5: "½", 0.75: "¾" }[Math.round((servings - whole) * 4) / 4] ?? "";
  return whole === 0 ? part || "0" : `${whole}${part}`;
}
