import { useColorScheme } from "react-native";
import { useAppStore } from "@/store/app-store";
import type { WorkoutType } from "@/lib/types";
import { effortTone } from "@/lib/workouts";

// Values and their reasons are documented in DESIGN.md.
export interface Theme {
  scheme: "light" | "dark";
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  separator: string;
  track: string;
  onTrack: string;
  trackSoft: string;
  field: string;
  onField: string;
  fieldSoft: string;
  focus: string;
}

const light: Theme = {
  scheme: "light",
  bg: "#F7F4EF",
  surface: "#FFFFFF",
  surfaceAlt: "#EFEAE2",
  text: "#1B1A17",
  textMuted: "#5C574F",
  separator: "#DDD6CB",
  track: "#A8361F",
  onTrack: "#FFFFFF",
  trackSoft: "#F3DED8",
  field: "#2B6440",
  onField: "#FFFFFF",
  fieldSoft: "#DCEADF",
  focus: "#1B1A17",
};

const dark: Theme = {
  scheme: "dark",
  bg: "#12110F",
  surface: "#1F1D1A",
  surfaceAlt: "#2A2724",
  text: "#F2EFE9",
  textMuted: "#ABA59B",
  separator: "#3A3632",
  track: "#F0785C",
  onTrack: "#12110F",
  trackSoft: "#3B231D",
  field: "#6FC48F",
  onField: "#12110F",
  fieldSoft: "#1D3325",
  focus: "#F2EFE9",
};

export const space = { xs: 4, s: 8, m: 12, l: 20, xl: 32 } as const;
export const radius = { section: 14, button: 10, lane: 3 } as const;

/** Scroll content: phone padding, and a readable column on tablets and wide windows. */
export const screenContent = {
  padding: 16,
  paddingBottom: 48,
  width: "100%",
  maxWidth: 680,
  alignSelf: "center",
} as const;

export const fonts = {
  numeral: "BarlowCondensed_600SemiBold",
  numeralBold: "BarlowCondensed_700Bold",
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

export function effortColor(theme: Theme, type: WorkoutType): { fill: string; on: string; soft: string } {
  return effortTone(type) === "hard"
    ? { fill: theme.track, on: theme.onTrack, soft: theme.trackSoft }
    : { fill: theme.field, on: theme.onField, soft: theme.fieldSoft };
}
