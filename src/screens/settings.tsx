import Constants from "expo-constants";
import { router } from "expo-router";
import { ScrollView, Switch, View } from "react-native";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { Section, SectionTitle } from "@/components/section";
import { Txt } from "@/components/text";
import { useT } from "@/i18n";
import { type Settings, useAppStore } from "@/store/app-store";
import { useTrainingStore } from "@/store/training-store";
import { confirm } from "@/services/confirm";
import { space, useTheme, screenContent } from "@/theme";

export function SettingsScreen() {
  const t = useT();
  const theme = useTheme();
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);

  const group = <K extends keyof Settings>(title: string, key: K, options: [Settings[K], string][]) => (
    <View style={{ gap: space.m }}>
      <SectionTitle>{title}</SectionTitle>
      <ChipRow>
        {options.map(([value, label]) => (
          <Chip key={String(value)} label={label} selected={settings[key] === value} onPress={() => update({ [key]: value } as Partial<Settings>)} />
        ))}
      </ChipRow>
    </View>
  );

  const toggle = (label: string, key: "voice" | "splitCues" | "paceCues", hint?: string, disabled?: boolean) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.m, paddingHorizontal: 16, paddingVertical: 12, minHeight: 52, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt nativeID={`setting-${key}`}>{label}</Txt>
        {hint ? (
          <Txt variant="caption" muted>
            {hint}
          </Txt>
        ) : null}
      </View>
      <Switch
        value={settings[key]}
        onValueChange={(v) => update({ [key]: v })}
        disabled={disabled}
        accessibilityLabelledBy={`setting-${key}`}
        aria-label={label}
        trackColor={{ true: theme.field, false: theme.separator }}
        thumbColor={process.env.EXPO_OS === "android" ? theme.surface : undefined}
      />
    </View>
  );

  const reset = async () => {
    if (!(await confirm(t.settings.resetTitle, t.settings.resetBody, t.common.delete, t.common.cancel, true))) return;
    resetAll();
    useTrainingStore.getState().reset();
    router.dismissAll();
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      {group(t.settings.units, "units", [
        ["km", t.common.km],
        ["mi", t.common.mi],
      ])}
      {group(t.settings.language, "language", [
        ["system", t.settings.system],
        ["id", t.settings.indonesian],
        ["en", t.settings.english],
      ])}
      {group(t.settings.theme, "theme", [
        ["system", t.settings.system],
        ["light", t.settings.light],
        ["dark", t.settings.dark],
      ])}
      <Section>
        {toggle(t.settings.voice, "voice", t.settings.voiceHint)}
        {toggle(t.settings.splitCues, "splitCues", undefined, !settings.voice)}
        {toggle(t.settings.paceCues, "paceCues", undefined, !settings.voice)}
      </Section>
      <View style={{ gap: space.m }}>
        <SectionTitle>{t.settings.data}</SectionTitle>
        <Button label={t.settings.reset} kind="danger" icon="trash" onPress={() => void reset()} />
      </View>
      <Txt variant="caption" muted style={{ textAlign: "center" }}>
        {t.settings.version(Constants.expoConfig?.version ?? "1.0.0")}
      </Txt>
    </ScrollView>
  );
}
