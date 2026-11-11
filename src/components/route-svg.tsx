import { View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import type { RoutePoint } from "@/lib/types";
import { radius, useTheme } from "@/theme";

export interface RouteViewProps {
  points: RoutePoint[];
  height: number;
  accessibilityLabel: string;
}

/** Route drawn without map tiles: an equirectangular projection scaled to fit. */
export function RouteSvg({ points, height, accessibilityLabel }: RouteViewProps) {
  const theme = useTheme();
  const width = 1000;
  const pad = 40;
  let body = null;

  if (points.length >= 2) {
    const lat0 = points[0][0];
    const k = Math.cos((lat0 * Math.PI) / 180);
    const xs = points.map((p) => p[1] * k);
    const ys = points.map((p) => -p[0]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const scale = Math.min((width - 2 * pad) / (maxX - minX || 1e-9), (height * 2 - 2 * pad) / (maxY - minY || 1e-9));
    const offX = (width - (maxX - minX) * scale) / 2;
    const offY = (height * 2 - (maxY - minY) * scale) / 2;
    const coords = xs.map((x, i) => [offX + (x - minX) * scale, offY + (ys[i] - minY) * scale]);
    const last = coords[coords.length - 1];
    body = (
      <>
        <Polyline
          points={coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
          fill="none"
          stroke={theme.track}
          strokeWidth={8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={coords[0][0]} cy={coords[0][1]} r={14} fill={theme.field} stroke={theme.surface} strokeWidth={5} />
        <Circle cx={last[0]} cy={last[1]} r={14} fill={theme.text} stroke={theme.surface} strokeWidth={5} />
      </>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ height, backgroundColor: theme.surfaceAlt, borderRadius: radius.section, borderCurve: "continuous", overflow: "hidden" }}
    >
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height * 2}`} preserveAspectRatio="xMidYMid meet">
        {body}
      </Svg>
    </View>
  );
}
