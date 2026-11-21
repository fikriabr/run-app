import { View } from "react-native";
import Svg, { Line, Polyline } from "react-native-svg";
import { daysBetween } from "@/lib/dates";
import type { WeightEntry } from "@/lib/nutrition-types";
import { useTheme } from "@/theme";
import { Txt } from "./text";

/** Weight over time on a date axis, with the target as a dashed line when it fits the range. */
export function WeightChart({
  entries,
  targetKg,
  label,
  dayLabel,
  height = 120,
}: {
  entries: WeightEntry[];
  targetKg?: number;
  label: string;
  dayLabel: (date: string) => string;
  height?: number;
}) {
  const theme = useTheme();
  if (entries.length < 2) return null;
  const first = entries[0].date;
  const span = Math.max(1, daysBetween(first, entries[entries.length - 1].date));
  const values = entries.map((e) => e.kg);
  const lo = Math.min(...values, targetKg ?? Infinity) - 0.5;
  const hi = Math.max(...values, targetKg ?? -Infinity) + 0.5;
  const width = 1000;
  const pad = 8;
  const x = (date: string) => pad + (daysBetween(first, date) / span) * (width - pad * 2);
  const y = (kg: number) => pad + ((hi - kg) / (hi - lo)) * (height - pad * 2);
  const last = entries[entries.length - 1];

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ gap: 6 }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {targetKg != null ? (
          <Line x1={0} x2={width} y1={y(targetKg)} y2={y(targetKg)} stroke={theme.accent} strokeWidth={2} strokeDasharray="10 8" />
        ) : null}
        <Polyline
          points={entries.map((e) => `${x(e.date)},${y(e.kg)}`).join(" ")}
          fill="none"
          stroke={theme.primary}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Txt variant="caption" muted>
          {dayLabel(first)}
        </Txt>
        <Txt variant="caption" muted>
          {dayLabel(last.date)}
        </Txt>
      </View>
    </View>
  );
}
