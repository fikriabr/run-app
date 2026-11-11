import { useColorScheme } from "react-native";
import { useAppStore } from "@/store/app-store";
import type { WorkoutType } from "@/lib/types";
import { effortTone } from "@/lib/workouts";

// Values and their reasons are documented in DESIGN.md.
export interface Theme {
  scheme: "light" | "dark";
  /** Hero band on Home and the inverted rest timer. */
  navy: string;
  onNavy: string;
  navyMuted: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  separator: string;
  /** Red fill: the main call to action and hard efforts. */
  accent: string;
  onAccent: string;
  /** Red for text, a shade darker than the fill so small text keeps 4.5:1. */
  accentText: string;
  accentSoft: string;
  /** Blue: links, selection, completed state and steady efforts. */
  primary: string;
  onPrimary: string;
  primarySoft: string;
  /** Yellow marks strength sessions; used as a fill only, never as text. */
  yellow: string;
  yellowSoft: string;
  focus: string;
}

const light: Theme = {
  scheme: "light",
  navy: "#0E1238",
  onNavy: "#FFFFFF",
  navyMuted: "#A9B0D6",
  bg: "#F2F4F8",
  surface: "#FFFFFF",
  surfaceAlt: "#E9ECF3",
  text: "#12152B",
  textMuted: "#5E6582",
  separator: "#E1E5EE",
  accent: "#D63031",
  onAccent: "#FFFFFF",
  accentText: "#C92A2A",
  accentSoft: "#FDECEC",
  primary: "#1D4ED8",
  onPrimary: "#FFFFFF",
  primarySoft: "#E6EDFC",
  yellow: "#F5B82E",
  yellowSoft: "#FFF4D6",
  focus: "#1D4ED8",
};

const dark: Theme = {
  scheme: "dark",
  navy: "#060818",
  onNavy: "#F3F4FA",
  navyMuted: "#A3A8C3",
  bg: "#0B0E26",
  surface: "#171B3D",
  surfaceAlt: "#222850",
  text: "#F3F4FA",
  textMuted: "#A3A8C3",
  separator: "#2C3260",
  accent: "#FF6B6B",
  onAccent: "#0B0E26",
  accentText: "#FF6B6B",
  accentSoft: "#3A1F2B",
  primary: "#7FA6FF",
  onPrimary: "#0B0E26",
  primarySoft: "#1B2350",
  yellow: "#F5C451",
  yellowSoft: "#3A3218",
  focus: "#7FA6FF",
};

export const space = { xs: 4, s: 8, m: 12, l: 20, xl: 32 } as const;
export const radius = { card: 20, section: 16, button: 12, pill: 999, lane: 3 } as const;

/** Scroll content: phone padding, and a readable column on tablets and wide windows. */
export const screenContent = {
  padding: 16,
  paddingBottom: 48,
  width: "100%",
  maxWidth: 680,
  alignSelf: "center",
} as const;

/** Plus Jakarta Sans, one family per weight because Android cannot synthesise weights for custom fonts. */
export const fonts = {
  regular: "PlusJakartaSans_500Medium",
  medium: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  heavy: "PlusJakartaSans_800ExtraBold",
};

export function useResolvedScheme(): "light" | "dark" {
  const pref = useAppStore((s) => s.settings.theme);
  const system = useColorScheme();
  if (pref === "system") return system === "dark" ? "dark" : "light";
  return pref;
}

export function useTheme(): Theme {
  return useResolvedScheme() === "dark" ? dark : light;
}

export function effortColor(theme: Theme, type: WorkoutType): { fill: string; on: string; soft: string; text: string } {
  return effortTone(type) === "hard"
    ? { fill: theme.accent, on: theme.onAccent, soft: theme.accentSoft, text: theme.accentText }
    : { fill: theme.primary, on: theme.onPrimary, soft: theme.primarySoft, text: theme.primary };
}
