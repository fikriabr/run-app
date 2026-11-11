import { getLocales } from "expo-localization";
import { useAppStore } from "@/store/app-store";
import { type Dictionary, en } from "./en";
import { id } from "./id";

export type { Dictionary };

export function resolveLanguage(pref: "system" | "en" | "id"): "en" | "id" {
  if (pref !== "system") return pref;
  const code = getLocales()[0]?.languageCode;
  return code === "id" || code === "ms" ? "id" : "en";
}

export function dictionaryFor(lang: "en" | "id"): Dictionary {
  return lang === "id" ? id : en;
}

export function useT(): Dictionary {
  const pref = useAppStore((s) => s.settings.language);
  return dictionaryFor(resolveLanguage(pref));
}
