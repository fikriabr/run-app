import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { Section, SectionTitle } from "@/components/section";
import { Num, Txt } from "@/components/text";
import { useT } from "@/i18n";
import { parseDuration } from "@/lib/format";
import { GOAL_DISTANCE, vdotFromPerformance } from "@/lib/vdot";
import { useAppStore } from "@/store/app-store";
import { radius, space, useTheme, screenContent } from "@/theme";

const DISTANCES = ["5k", "10k", "half", "marathon"] as const;

export function FitnessScreen() {
  const t = useT();
  const theme = useTheme();
  const vdot = useAppStore((s) => s.vdot) ?? 40;
  const setVdot = useAppStore((s) => s.setVdot);
  const [distance, setDistance] = useState<(typeof DISTANCES)[number]>("5k");
  const [time, setTime] = useState("");
  const seconds = parseDuration(time);
  const fromResult = seconds ? Math.round(vdotFromPerformance(GOAL_DISTANCE[distance], seconds) * 10) / 10 : null;
  const invalid = time.length > 0 && !seconds;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <View style={{ gap: 2 }}>
        <Txt variant="label" muted>
          {t.you.fitness}
        </Txt>
        <Num size={56} color={theme.track} selectable>
          {vdot.toFixed(1)}
        </Num>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.fitness.fromResult}</SectionTitle>
        <Section style={{ padding: 16, gap: space.m }}>
          <ChipRow>
            {DISTANCES.map((d) => (
              <Chip key={d} label={t.goal[d]} selected={distance === d} onPress={() => setDistance(d)} />
            ))}
          </ChipRow>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder={t.onboarding.resultTimeHint}
            placeholderTextColor={theme.textMuted}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
            aria-label={t.onboarding.resultTime}
            style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: radius.button, backgroundColor: theme.surfaceAlt, color: theme.text, fontSize: 20 }}
          />
          {invalid ? (
            <Txt variant="caption" color={theme.track} accessibilityLiveRegion="polite">
              {t.onboarding.resultInvalid}
            </Txt>
          ) : null}
          <Button
            label={fromResult ? `${t.fitness.apply} (${fromResult.toFixed(1)})` : t.fitness.apply}
            disabled={!fromResult}
            onPress={() => {
              if (!fromResult) return;
              setVdot(fromResult, "manual");
              router.back();
            }}
          />
        </Section>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.fitness.nudge}</SectionTitle>
        <View style={{ flexDirection: "row", gap: space.s }}>
          <Button label={t.fitness.easier} kind="secondary" icon="minus" onPress={() => setVdot(vdot - 0.5, "manual")} style={{ flex: 1 }} />
          <Button label={t.fitness.harder} kind="secondary" icon="plus" onPress={() => setVdot(vdot + 0.5, "manual")} style={{ flex: 1 }} />
        </View>
      </View>
    </ScrollView>
  );
}
