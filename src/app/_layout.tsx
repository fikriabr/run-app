import "@/services/location";
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, useFonts } from "@expo-google-fonts/barlow-condensed";
import { Stack } from "expo-router";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { useT } from "@/i18n";
import { useStackOptions } from "@/hooks/use-stack-options";
import { useAppStore } from "@/store/app-store";
import { useResolvedScheme, useTheme } from "@/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold });
  const t = useT();
  const theme = useTheme();
  const scheme = useResolvedScheme();
  const themePref = useAppStore((s) => s.settings.theme);
  const hasPlan = useAppStore((s) => s.plan != null);
  const stackOptions = useStackOptions();
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    // Native chrome (alerts, pickers, keyboards) follows the in-app theme choice.
    if (process.env.EXPO_OS !== "web") Appearance.setColorScheme(themePref === "system" ? "unspecified" : themePref);
    void SystemUI.setBackgroundColorAsync(theme.bg);
  }, [themePref, theme.bg]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: theme.bg, card: theme.bg, text: theme.text, primary: theme.track, border: theme.separator },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={stackOptions}>
        <Stack.Protected guard={hasPlan}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/[id]" options={{ title: "" }} />
          <Stack.Screen name="run" options={{ presentation: "fullScreenModal", headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="run-save" options={{ presentation: "fullScreenModal", title: t.save.title, gestureEnabled: false, headerBackVisible: false }} />
          <Stack.Screen name="plan-setup" options={{ presentation: "modal", title: t.onboarding.title }} />
          <Stack.Screen
            name="fitness"
            options={{ presentation: "formSheet", sheetGrabberVisible: true, sheetAllowedDetents: [0.8, 1], title: t.fitness.title }}
          />
          <Stack.Screen name="runs/[id]" options={{ title: "" }} />
          <Stack.Screen name="settings" options={{ title: t.settings.title }} />
        </Stack.Protected>
        <Stack.Protected guard={!hasPlan}>
          <Stack.Screen name="onboarding" options={{ title: t.onboarding.title, headerLargeTitleEnabled: true }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
