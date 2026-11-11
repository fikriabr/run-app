import { Stack } from "expo-router";
import { useT } from "@/i18n";
import { useStackOptions } from "@/hooks/use-stack-options";

export default function PlanStack() {
  const t = useT();
  const options = useStackOptions(true);
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ title: t.tabs.plan }} />
    </Stack>
  );
}
