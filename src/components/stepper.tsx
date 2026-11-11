import { Pressable, View, type ViewStyle } from "react-native";
import { radius, useTheme } from "@/theme";
import { Icon } from "./icon";
import { Num, Txt } from "./text";

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

export function Stepper({ value, min, max, step = 1, label, format, onChange }: StepperProps) {
  const theme = useTheme();
  const button = (dir: -1 | 1) => {
    const next = Math.min(max, Math.max(min, value + dir * step));
    const disabled = next === value;
    return (
      <Pressable
        onPress={() => onChange(next)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${dir < 0 ? "−" : "+"} ${label}`}
        accessibilityState={{ disabled }}
        style={({ pressed }) =>
          ({
            width: 48,
            height: 48,
            borderRadius: radius.button,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? theme.separator : theme.primarySoft,
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }) as ViewStyle
        }
      >
        <Icon name={dir < 0 ? "minus" : "plus"} size={18} color={theme.primary} />
      </Pressable>
    );
  };
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        const dir = e.nativeEvent.actionName === "increment" ? 1 : -1;
        onChange(Math.min(max, Math.max(min, value + dir * step)));
      }}
    >
      {button(-1)}
      <View style={{ flex: 1, alignItems: "center" }}>
        <Num size={32}>{format(value)}</Num>
        <Txt variant="caption" muted>
          {label}
        </Txt>
      </View>
      {button(1)}
    </View>
  );
}
