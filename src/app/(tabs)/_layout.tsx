import { NativeTabs } from "expo-router/native-tabs";
import { useT } from "@/i18n";
import { useTheme } from "@/theme";

export default function TabsLayout() {
  const t = useT();
  const theme = useTheme();
  return (
    <NativeTabs
      tintColor={theme.track}
      backgroundColor={theme.surface}
      iconColor={{ default: theme.textMuted, selected: theme.track }}
      labelStyle={{ default: { color: theme.textMuted }, selected: { color: theme.track } }}
      indicatorColor={theme.trackSoft}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="(today)">
        <NativeTabs.Trigger.Icon sf={{ default: "sun.max", selected: "sun.max.fill" }} md="today" />
        <NativeTabs.Trigger.Label>{t.tabs.today}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>{t.tabs.plan}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Icon sf="figure.run" md="directions_run" />
        <NativeTabs.Trigger.Label>{t.tabs.activity}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="person" />
        <NativeTabs.Trigger.Label>{t.tabs.you}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
