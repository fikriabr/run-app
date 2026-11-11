import { View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import { useTheme } from "@/theme";
import { Txt } from "./text";

interface Bar {
  value: number;
  label: string;
  highlight?: boolean;
}

/** Vertical bars with the value scale on the right; the latest bar is highlighted. */
export function BarChart({ bars, height = 120, accessibilityLabel, format }: { bars: Bar[]; height?: number; accessibilityLabel: string; format: (v: number) => string }) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));
  const width = 1000;
  const gap = 12;
  const barW = (width - gap * (bars.length - 1)) / bars.length;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Txt variant="caption" muted>
          {format(max)}
        </Txt>
      </View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Line x1={0} x2={width} y1={0.5} y2={0.5} stroke={theme.separator} strokeWidth={1} strokeDasharray="6 6" />
        <Line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke={theme.separator} strokeWidth={1} />
        {bars.map((b, i) => {
          const h = b.value > 0 ? Math.max(3, (b.value / max) * (height - 2)) : 0;
          return (
            <Rect
              key={i}
              x={i * (barW + gap)}
              y={height - h}
              width={barW}
              height={h}
              rx={4}
              fill={b.highlight ? theme.accent : theme.primary}
            />
          );
        })}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Txt variant="caption" muted>
          {bars[0]?.label}
        </Txt>
        <Txt variant="caption" muted>
          {bars[bars.length - 1]?.label}
        </Txt>
      </View>
    </View>
  );
}
