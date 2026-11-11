import { Pressable, View, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { fromDateKey } from "@/lib/dates";
import { radius, useTheme } from "@/theme";
import { Icon } from "./icon";
import { Txt } from "./text";

export interface DayItem {
  kind: "easy" | "hard" | "strength";
  done: boolean;
}

interface WeekRingsProps {
  days: string[];
  today: string;
  items: Record<string, DayItem[]>;
  weekdayLetter: (day: string) => string;
  dayLabel: (day: string, items: DayItem[]) => string;
  onPressDay: (day: string) => void;
}

const SIZE = 40;
const STROKE = 4;

/** One ring per day: empty when planned, an arc for partly done, filled with a tick when everything is done. */
export function WeekRings({ days, today, items, weekdayLetter, dayLabel, onPressDay }: WeekRingsProps) {
  const theme = useTheme();
  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {days.map((day) => {
        const list = items[day] ?? [];
        const done = list.filter((i) => i.done).length;
        const all = list.length > 0 && done === list.length;
        const missed = list.length > 0 && !all && day < today;
        const isToday = day === today;
        const fraction = list.length ? done / list.length : 0;
        const dotColor = (k: DayItem["kind"]) => (k === "hard" ? theme.accent : k === "strength" ? theme.yellow : theme.primary);

        return (
          <Pressable
            key={day}
            onPress={() => onPressDay(day)}
            accessibilityRole="button"
            accessibilityLabel={dayLabel(day, list)}
            style={({ pressed }) =>
              ({
                flex: 1,
                minWidth: 40,
                alignItems: "center",
                gap: 8,
                paddingVertical: 10,
                borderRadius: radius.button,
                backgroundColor: isToday ? theme.primarySoft : pressed ? theme.surfaceAlt : "transparent",
                cursor: "pointer",
              }) as ViewStyle
            }
          >
            <Txt variant="heading" color={isToday ? theme.primary : theme.text} style={{ fontSize: 15 }}>
              {weekdayLetter(day)}
            </Txt>
            <Txt variant="body" color={isToday ? theme.primary : theme.text} style={{ fontSize: 15 }}>
              {fromDateKey(day).getDate()}
            </Txt>
            <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
              <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={r}
                  stroke={missed ? theme.accentSoft : theme.separator}
                  strokeWidth={STROKE}
                  fill={all ? theme.primarySoft : "none"}
                />
                {!all && fraction > 0 ? (
                  <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={r}
                    stroke={theme.primary}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${circumference * fraction} ${circumference}`}
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  />
                ) : null}
              </Svg>
              {all ? <Icon name="tick" size={18} color={theme.primary} /> : null}
            </View>
            <View style={{ flexDirection: "row", gap: 3, height: 6 }}>
              {list.map((item, i) => (
                <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor(item.kind) }} />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
