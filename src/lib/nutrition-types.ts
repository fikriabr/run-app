import type { Localized } from "./training-types";

/** Regional menus the runner can pick from. "any" items fit every menu. */
export type Cuisine = "indonesian" | "western" | "chinese" | "japanese" | "korean" | "indian" | "mediterranean";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** What a recipe contains, used to honour diet choices. */
export type FoodTag = "pork" | "beef" | "poultry" | "fish" | "seafood" | "egg" | "dairy" | "soy";

export type DietFlag = "vegetarian" | "noPork" | "noBeef" | "noSeafood" | "noDairy";

export type Sex = "male" | "female";
export type ActivityLevel = "low" | "light" | "moderate" | "high";
export type DietGoal = "lose" | "maintain" | "gain";

export interface Recipe {
  id: string;
  cuisine: Cuisine | "any";
  slots: MealSlot[];
  name: Localized;
  /** Hands-on plus cooking time, minutes. */
  minutes: number;
  /** Per serving. Estimates from standard food tables. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  contains: FoodTag[];
  ingredients: { en: string[]; id: string[] };
  steps: { en: string[]; id: string[] };
}

export interface BodyProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  /** Daily activity outside planned runs; runs are added per day on top. */
  activity: ActivityLevel;
  goal: DietGoal;
  targetKg?: number;
}

export interface FoodPrefs {
  cuisines: Cuisine[];
  diet: DietFlag[];
  mealsPerDay: 3 | 4;
}

export interface WeightEntry {
  /** YYYY-MM-DD. */
  date: string;
  kg: number;
}

export interface ProteinBoost {
  id: string;
  name: Localized;
  protein: number;
  kcal: number;
  contains: FoodTag[];
}
