import { useLocalSearchParams } from "expo-router";
import { NutritionSetup } from "@/screens/nutrition-setup";
import { nextOnboardingStep } from "@/screens/welcome";

export default function OnboardingDiet() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  return <NutritionSetup onDone={() => nextOnboardingStep(next ? next.split(",") : [])} />;
}
