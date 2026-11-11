import { Children, Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { radius, space, useTheme } from "@/theme";
import { Icon } from "./icon";
import { Txt } from "./text";

export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, gap: space.s }}>
      <Txt variant="label" muted accessibilityRole="header" style={{ flexShrink: 1 }}>
        {children}
      </Txt>
      {action}
    </View>
  );
}

/** A grouped block of rows on the surface colour, separated by hairlines. */
export function Section({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", overflow: "hidden" }, style]}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.separator, marginLeft: 16 }} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  value?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
}

export function Row({ title, subtitle, value, leading, trailing, onPress, accessibilityHint }: RowProps) {
  const theme = useTheme();
  const content = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.m, paddingHorizontal: 16, paddingVertical: 12, minHeight: 52 }}>
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="body" numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" muted numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt variant="body" muted selectable>
          {value}
        </Txt>
      ) : null}
      {trailing}
      {onPress ? <Icon name="chevron" size={14} color={theme.textMuted} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={(state) => {
        const focused = (state as { focused?: boolean }).focused;
        return {
          backgroundColor: state.pressed ? theme.surfaceAlt : "transparent",
          cursor: "pointer",
          outlineColor: theme.focus,
          outlineStyle: focused ? "solid" : undefined,
          outlineWidth: focused ? 2 : 0,
          outlineOffset: -2,
        } as ViewStyle;
      }}
    >
      {content}
    </Pressable>
  );
}
