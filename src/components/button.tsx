import { ActivityIndicator, Pressable, type PressableProps, type StyleProp, View, type ViewStyle } from "react-native";
import { radius, useTheme } from "@/theme";
import { Icon, type IconName } from "./icon";
import { Txt } from "./text";

type Kind = "primary" | "secondary" | "plain" | "danger";

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  kind?: Kind;
  icon?: IconName;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, kind = "primary", icon, loading, disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const palette: Record<Kind, { bg: string; fg: string }> = {
    primary: { bg: theme.track, fg: theme.onTrack },
    secondary: { bg: theme.surfaceAlt, fg: theme.text },
    plain: { bg: "transparent", fg: theme.text },
    danger: { bg: "transparent", fg: theme.track },
  };
  const { bg, fg } = palette[kind];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      {...rest}
      style={(state) => {
        const { pressed } = state;
        const focused = (state as { focused?: boolean }).focused;
        return [
          {
            minHeight: 48,
            paddingHorizontal: 18,
            borderRadius: radius.button,
            borderCurve: "continuous",
            backgroundColor: bg,
            alignItems: "center",
            justifyContent: "center",
            opacity: inactive ? 0.45 : pressed ? 0.8 : 1,
            cursor: inactive ? "not-allowed" : "pointer",
            outlineColor: theme.focus,
            outlineStyle: focused ? "solid" : undefined,
            outlineWidth: focused ? 2 : 0,
            outlineOffset: 2,
          } as ViewStyle,
          style,
        ];
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
        <Txt variant="heading" color={fg} numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}
