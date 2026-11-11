import { View } from "react-native";
import { Num, Txt } from "./text";

export function Stat({ label, value, unit, size = 26, color }: { label: string; value: string; unit?: string; size?: number; color?: string }) {
  return (
    <View style={{ gap: 2, minWidth: 0 }} accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ""}`}>
      <Txt variant="caption" muted numberOfLines={1}>
        {label}
      </Txt>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <Num size={size} color={color} selectable numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Num>
        {unit ? (
          <Txt variant="caption" muted>
            {unit}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}
