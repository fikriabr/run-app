import { Pressable, View, type ViewStyle } from "react-native";
import { fonts, useTheme } from "@/theme";
import { Txt } from "./text";

interface TopTabsProps<K extends string> {
  tabs: [K, string][];
  value: K;
  onChange: (key: K) => void;
}

/** Text tabs with a red underline on the active one, sitting directly under the header. */
export function TopTabs<K extends string>({ tabs, value, onChange }: TopTabsProps<K>) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: "row", backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.separator, paddingHorizontal: 8 }}
    >
      {tabs.map(([key, label]) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => ({ flex: 1, alignItems: "center", paddingTop: 12, opacity: pressed ? 0.7 : 1, cursor: "pointer" }) as ViewStyle}
          >
            <Txt variant="heading" color={selected ? theme.primary : theme.text} style={{ fontFamily: selected ? fonts.bold : fonts.regular, fontSize: 16 }}>
              {label}
            </Txt>
            <View style={{ height: 4, width: "70%", marginTop: 10, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: selected ? theme.accent : "transparent" }} />
          </Pressable>
        );
      })}
    </View>
  );
}
