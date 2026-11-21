import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { Banner, EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { Section, SectionTitle } from "@/components/section";
import { Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useT } from "@/i18n";
import { formatDuration, parseDuration, unitMeters } from "@/lib/format";
import { middayOf, weekIndexOf } from "@/lib/rebalance";
import { workoutDistance, workoutDuration } from "@/lib/workouts";
import { newId, useAppStore } from "@/store/app-store";
import { fonts, radius, space, useTheme, screenContent } from "@/theme";
import { RebalanceCard } from "./rebalance-card";

/** Parses "5", "5.2" or "5,2" in the runner's unit into metres. */
function parseDistance(text: string, perUnit: number): number | null {
  const value = Number(text.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 && value < 500 ? Math.round(value * perUnit) : null;
}

/** A run logged today ended just now; one logged for an earlier day is placed at midday. */
function startTime(date: string, today: string, durationSeconds: number): number {
  return date === today ? Date.now() - durationSeconds * 1000 : middayOf(date);
}

/** Marks a planned run as done with what was actually run, for runs tracked elsewhere. */
export function RunLogScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const plan = useAppStore((s) => s.plan);
  const vdot = useAppStore((s) => s.vdot) ?? plan?.input.vdot ?? 40;
  const saveActivity = useAppStore((s) => s.saveActivity);
  const workout = workoutId ? plan?.workouts.find((w) => w.id === workoutId) : undefined;
  const goal = plan?.input.goal ?? "fitness";
  const perUnit = unitMeters(f.units);

  const plannedDistance = workout ? workoutDistance(workout, vdot, goal) : 5000;
  const plannedDuration = workout ? workoutDuration(workout, vdot, goal) : 30 * 60;
  const [distanceText, setDistanceText] = useState(() => (Math.round((plannedDistance / perUnit) * 10) / 10).toString());
  const [timeText, setTimeText] = useState(() => formatDuration(plannedDuration));
  // Until the runner edits the time, it follows the distance at the planned pace.
  const [timeEdited, setTimeEdited] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [savedWeek, setSavedWeek] = useState<number | null>(null);

  if (workoutId && !workout) return <EmptyState icon="missed" title={t.common.errorTitle} body={t.workoutDetail.notFound} />;

  const distance = parseDistance(distanceText, perUnit);
  const duration = parseDuration(timeText);
  const date = workout?.date && workout.date <= today ? workout.date : today;

  const onDistance = (text: string) => {
    setDistanceText(text);
    const meters = parseDistance(text, perUnit);
    if (!timeEdited && meters) setTimeText(formatDuration((plannedDuration * meters) / plannedDistance));
  };

  const save = () => {
    setTried(true);
    if (!distance || !duration) return;
    saveActivity(
      {
        id: newId("a"),
        startedAt: startTime(date, today, duration),
        duration,
        distance,
        elevationGain: 0,
        splits: [],
        pointCount: 0,
        manual: true,
        workoutId: workout?.id,
        workoutType: workout?.type,
      },
      [],
      rpe,
      note,
    );
    const week = workout ? workout.week : plan ? weekIndexOf(plan, date) : null;
    if (week == null) router.back();
    else setSavedWeek(week);
  };

  if (savedWeek != null) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
        <Stack.Screen options={{ title: t.log.savedTitle }} />
        <Banner icon="check" tone="good" title={t.log.savedTitle} body={`${f.distanceWithUnit(distance ?? 0)} · ${formatDuration(duration ?? 0)}`} />
        <RebalanceCard weekIndex={savedWeek} />
        <Button label={t.common.done} kind="secondary" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  const inputStyle = {
    minHeight: 56,
    paddingHorizontal: 16,
    color: theme.text,
    fontFamily: fonts.bold,
    fontSize: 22,
    fontVariant: ["tabular-nums" as const],
    borderRadius: radius.section,
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Stack.Screen options={{ title: workout ? t.workout[workout.type] : t.log.title }} />
      <Txt variant="label" muted>
        {f.dayLong(date)}
      </Txt>

      <View style={{ gap: space.s }}>
        <SectionTitle>{t.log.distance}</SectionTitle>
        <Section>
          <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 16 }}>
            <TextInput
              value={distanceText}
              onChangeText={onDistance}
              keyboardType="decimal-pad"
              selectTextOnFocus
              aria-label={t.log.distance}
              style={[inputStyle, { flex: 1 }]}
            />
            <Txt muted>{f.unit}</Txt>
          </View>
        </Section>
        {workout ? (
          <Txt variant="caption" muted>
            {t.log.planned(f.distanceWithUnit(plannedDistance))}
          </Txt>
        ) : null}
        {tried && !distance ? (
          <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite">
            {t.log.distanceInvalid}
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: space.s }}>
        <SectionTitle>{t.log.time}</SectionTitle>
        <Section>
          <TextInput
            value={timeText}
            onChangeText={(text) => {
              setTimeEdited(true);
              setTimeText(text);
            }}
            keyboardType="numbers-and-punctuation"
            selectTextOnFocus
            aria-label={t.log.time}
            style={inputStyle}
          />
        </Section>
        <Txt variant="caption" color={tried && !duration ? theme.accentText : theme.textMuted} accessibilityLiveRegion="polite">
          {tried && !duration ? t.log.timeInvalid : t.log.timeHint}
        </Txt>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.save.effort}</SectionTitle>
        <ChipRow>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <Chip key={n} label={String(n)} selected={rpe === n} onPress={() => setRpe(rpe === n ? null : n)} />
          ))}
        </ChipRow>
        <Txt variant="caption" muted accessibilityLiveRegion="polite">
          {rpe != null ? t.save.rpe[rpe] : t.save.effortHint}
        </Txt>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.save.note}</SectionTitle>
        <Section>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t.save.notePlaceholder}
            placeholderTextColor={theme.textMuted}
            multiline
            aria-label={t.save.note}
            style={{ minHeight: 80, padding: 16, color: theme.text, fontFamily: fonts.medium, fontSize: 16, textAlignVertical: "top", borderRadius: radius.section }}
          />
        </Section>
      </View>

      <Button label={t.log.save} icon="check" onPress={save} />
    </ScrollView>
  );
}
