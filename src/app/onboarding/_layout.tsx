import { Stack } from "expo-router";
import { useT } from "@/i18n";
import { useStackOptions } from "@/hooks/use-stack-options";

export default function OnboardingStack() {
  const t = useT();
  const options = useStackOptions(true);
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ title: t.welcome.title }} />
      <Stack.Screen name="run" options={{ title: t.onboarding.title, headerLargeTitleEnabled: false }} />
      <Stack.Screen name="diet" options={{ title: t.nutrition.setupTitle, headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
