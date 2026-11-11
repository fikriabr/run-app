import { useMemo } from "react";
import { fromDateKey } from "@/lib/dates";
import { formatDistance, formatMinutes, formatPace } from "@/lib/format";
import type { GoalKind, Zone } from "@/lib/types";
import { zonePace } from "@/lib/vdot";
import { useT } from "@/i18n";
import { useAppStore } from "@/store/app-store";

/** Formatting bound to the runner's units and language. */
export function useFormat() {
  const t = useT();
  const units = useAppStore((s) => s.settings.units);
  return useMemo(() => {
    const unit = units === "km" ? t.common.km : t.common.mi;
    return {
      units,
      unit,
      perUnit: t.common.perUnit(unit),
      distance: (m: number, digits = 2) => formatDistance(m, units, digits),
      distanceWithUnit: (m: number, digits = 1) => `${formatDistance(m, units, digits)} ${unit}`,
      pace: (secPerKm: number | null | undefined) => formatPace(secPerKm, units),
      zoneRange: (vdot: number, zone: Zone, goal: GoalKind) => {
        const r = zonePace(vdot, zone, goal);
        return `${formatPace(r.fast, units)}–${formatPace(r.slow, units)}`;
      },
      minutes: (seconds: number) => {
        const { h, m } = formatMinutes(seconds);
        return t.common.minutes(h, m);
      },
      day: (key: string) => fromDateKey(key).toLocaleDateString(t.locale, { weekday: "short", day: "numeric", month: "short" }),
      dayLong: (key: string) => fromDateKey(key).toLocaleDateString(t.locale, { weekday: "long", day: "numeric", month: "long" }),
      weekdayShort: (key: string) => fromDateKey(key).toLocaleDateString(t.locale, { weekday: "short" }),
      dateTime: (ms: number) =>
        new Date(ms).toLocaleDateString(t.locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      month: (ms: number) => new Date(ms).toLocaleDateString(t.locale, { month: "long", year: "numeric" }),
    };
  }, [t, units]);
}
