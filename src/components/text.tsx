import { Text, type TextProps, type TextStyle } from "react-native";
import { fonts, useTheme } from "@/theme";

type Variant = "title" | "heading" | "body" | "label" | "caption";

const VARIANTS: Record<Variant, TextStyle> = {
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  heading: { fontSize: 17, fontWeight: "600", lineHeight: 22 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
};

interface TxtProps extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
}

export function Txt({ variant = "body", muted, color, style, ...rest }: TxtProps) {
  const theme = useTheme();
  return <Text {...rest} style={[VARIANTS[variant], { color: color ?? (muted ? theme.textMuted : theme.text) }, style]} />;
}

interface NumProps extends TextProps {
  size?: number;
  color?: string;
}

/** Scoreboard numerals: condensed so long times and paces fit at large sizes. */
export function Num({ size = 26, color, style, ...rest }: NumProps) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts.numeral,
          fontSize: size,
          lineHeight: Math.round(size * 1.1),
          color: color ?? theme.text,
          fontVariant: ["tabular-nums"],
        },
        style,
      ]}
    />
  );
}
