import { Text, type TextProps, type TextStyle } from "react-native";
import { fonts, useTheme } from "@/theme";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption";

// Weight is carried by the font family, so fontWeight stays unset to avoid faux-bold on iOS.
const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.heavy, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  title: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
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

/** Numbers in the heaviest weight with tabular figures, so a ticking clock does not jitter. */
export function Num({ size = 26, color, style, ...rest }: NumProps) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts.heavy,
          fontSize: size,
          lineHeight: Math.round(size * 1.15),
          letterSpacing: size >= 40 ? -1 : -0.3,
          color: color ?? theme.text,
          fontVariant: ["tabular-nums"],
        },
        style,
      ]}
    />
  );
}
