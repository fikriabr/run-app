import { useMemo } from "react";
import { fromDisplayWeight, toDisplayWeight } from "@/lib/training";
import { useAppStore } from "@/store/app-store";

/** Weight unit follows the distance unit: kilometres pair with kilograms, miles with pounds. */
export function useWeight() {
  const units = useAppStore((s) => s.settings.units);
  return useMemo(() => {
    const unit = units === "km" ? ("kg" as const) : ("lb" as const);
    return {
      unit,
      show: (kg: number | null) => (kg == null ? "" : String(toDisplayWeight(kg, unit))),
      parse: (text: string) => {
        const n = Number(text.replace(",", "."));
        return text.trim() === "" || !Number.isFinite(n) || n < 0 ? null : fromDisplayWeight(n, unit);
      },
    };
  }, [units]);
}
