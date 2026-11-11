import type { ComponentProps } from "react";
import type { Stack } from "expo-router";
import { useTheme } from "@/theme";

type ScreenOptions = NonNullable<ComponentProps<typeof Stack>["screenOptions"]>;

/** Header styling shared by every stack; large titles are switched on per tab root. */
export function useStackOptions(largeTitle = false): Exclude<ScreenOptions, (...args: never[]) => unknown> {
  const theme = useTheme();
  return {
    headerLargeTitleEnabled: largeTitle,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerStyle: { backgroundColor: theme.bg },
    headerLargeStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.text,
    headerTitleStyle: { color: theme.text },
    headerLargeTitleStyle: { color: theme.text },
    headerBackButtonDisplayMode: "minimal",
    contentStyle: { backgroundColor: theme.bg },
  };
}
