import { Pressable, View, type ViewStyle } from "react-native";
import { radius, space, useTheme } from "@/theme";
import { Txt } from "./text";

interface ChipProps {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  role?: "radio" | "checkbox";
  disabled?: boolean;
  grow?: boolean;
}

export function Chip({ label, hint, selected, onPress, role = "radio", disabled, grow }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      style={(state) => {
        const focused = (state as { focused?: boolean }).focused;
        return {
          flexGrow: grow ? 1 : 0,
          minHeight: 48,
          minWidth: 48,
          paddingHorizontal: 14,
          paddingVertical: hint ? 10 : 0,
          justifyContent: "center",
          borderRadius: radius.button,
          borderCurve: "continuous",
          backgroundColor: selected ? theme.primary : state.pressed ? theme.separator : theme.surfaceAlt,
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          outlineColor: theme.focus,
          outlineStyle: focused ? "solid" : undefined,
          outlineWidth: focused ? 2 : 0,
          outlineOffset: 2,
        } as ViewStyle;
      }}
    >
      <Txt variant="heading" color={selected ? theme.onPrimary : theme.text} style={{ textAlign: hint ? "left" : "center" }}>
        {label}
      </Txt>
      {hint ? (
        <Txt variant="caption" color={selected ? theme.onPrimary : theme.textMuted}>
          {hint}
        </Txt>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s }}>{children}</View>;
}
