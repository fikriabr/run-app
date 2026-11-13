import { View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import type { GoalKind, WorkoutStep } from "@/lib/types";
import { stepDuration, zoneIntensity } from "@/lib/workouts";
import { radius, useTheme } from "@/theme";

interface LaneChartProps {
  steps: WorkoutStep[];
  vdot: number;
  goal: GoalKind;
  height?: number;
  /** Highlights the active step during a run and dims finished ones. */
  activeIndex?: number;
  /** 0..1 progress through the active step. */
  activeProgress?: number;
  accessibilityLabel?: string;
}

/**
 * The identity motif from DESIGN.md: each step is a block whose width is its duration
 * and whose height is its intensity, coloured by effort.
 */
export function LaneChart({ steps, vdot, goal, height = 56, activeIndex, activeProgress = 0, accessibilityLabel }: LaneChartProps) {
  const theme = useTheme();
  const durations = steps.map((s) => stepDuration(s, vdot, goal));
  const total = durations.reduce((a, b) => a + b, 0) || 1;
  const gap = 2;
  const width = 1000;
  const usable = width - gap * Math.max(0, steps.length - 1);
  const widths = durations.map((d) => Math.max(3, (d / total) * usable));
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((sum, w) => sum + w + gap, 0));

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke={theme.separator} strokeWidth={1} />
        {steps.map((step, i) => {
          const w = widths[i];
          const h = Math.max(6, zoneIntensity(step.zone) * (height - 4));
          const hard = step.kind === "work" && step.zone !== "easy" && step.zone !== "long";
          const color = step.zone == null ? theme.separator : hard ? theme.accent : theme.primary;
          const done = activeIndex != null && i < activeIndex;
          const active = activeIndex === i;
          return (
            <Rect
              key={i}
              x={starts[i]}
              y={height - h}
              width={w}
              height={h}
              rx={radius.lane}
              fill={color}
              opacity={done ? 0.35 : activeIndex != null && !active ? 0.6 : 1}
            />
          );
        })}
        {activeIndex != null && activeIndex < steps.length ? (
          <Line
            x1={starts[activeIndex] + widths[activeIndex] * activeProgress}
            x2={starts[activeIndex] + widths[activeIndex] * activeProgress}
            y1={0}
            y2={height}
            stroke={theme.text}
            strokeWidth={3}
          />
        ) : null}
      </Svg>
    </View>
  );
}
