import { Tabs } from "expo-router/tabs";
import type { ColorValue } from "react-native";
import { Icon, type IconName } from "@/components/icon";
import { useT } from "@/i18n";
import { useTheme } from "@/theme";

// The web fallback of NativeTabs is a floating top bar that covers stack headers, so web uses a bottom bar.
export default function TabsLayoutWeb() {
  const t = useT();
  const theme = useTheme();
  const icon = (name: IconName) =>
    function TabIcon({ color }: { color: ColorValue }) {
      return <Icon name={name} size={22} color={color} />;
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.track,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.separator, height: 64 },
        tabBarItemStyle: { paddingVertical: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="(today)" options={{ title: t.tabs.today, tabBarIcon: icon("today") }} />
      <Tabs.Screen name="plan" options={{ title: t.tabs.plan, tabBarIcon: icon("plan") }} />
      <Tabs.Screen name="training" options={{ title: t.tabs.train, tabBarIcon: icon("strength") }} />
      <Tabs.Screen name="activity" options={{ title: t.tabs.activity, tabBarIcon: icon("run") }} />
      <Tabs.Screen name="you" options={{ title: t.tabs.you, tabBarIcon: icon("you") }} />
    </Tabs>
  );
}
