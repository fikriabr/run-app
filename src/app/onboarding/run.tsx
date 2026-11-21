import { useLocalSearchParams } from "expo-router";
import { PlanSetup } from "@/screens/plan-setup";
import { nextOnboardingStep } from "@/screens/welcome";

export default function OnboardingRun() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  return <PlanSetup mode="first" onDone={() => nextOnboardingStep(next ? next.split(",") : [])} />;
}
