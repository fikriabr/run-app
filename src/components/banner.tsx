import type { ReactNode } from "react";
import { View } from "react-native";
import { radius, space, useTheme } from "@/theme";
import { Icon, type IconName } from "./icon";
import { Txt } from "./text";

export function Banner({ icon, title, body, tone = "neutral", children }: { icon: IconName; title: string; body?: string; tone?: "neutral" | "good" | "attention"; children?: ReactNode }) {
  const theme = useTheme();
  const bg = tone === "good" ? theme.primarySoft : tone === "attention" ? theme.accentSoft : theme.surfaceAlt;
  const fg = tone === "good" ? theme.primary : tone === "attention" ? theme.accentText : theme.text;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.section, borderCurve: "continuous", padding: 16, gap: space.m }} accessibilityRole="summary">
      <View style={{ flexDirection: "row", gap: space.m }}>
        <Icon name={icon} size={20} color={fg} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="heading" color={fg}>
            {title}
          </Txt>
          {body ? <Txt variant="body">{body}</Txt> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body: string; children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: space.m }}>
      <Icon name={icon} size={36} color={theme.textMuted} />
      <Txt variant="title" style={{ textAlign: "center" }}>
        {title}
      </Txt>
      <Txt variant="body" muted style={{ textAlign: "center", maxWidth: 320 }}>
        {body}
      </Txt>
      {children}
    </View>
  );
}
