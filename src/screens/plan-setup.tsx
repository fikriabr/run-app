import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { Section, SectionTitle } from "@/components/section";
import { Stepper } from "@/components/stepper";
import { Num, Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useT } from "@/i18n";
import { addDays, mondayOf } from "@/lib/dates";
import { formatDuration, parseDuration, unitMeters } from "@/lib/format";
import { DEFAULT_WEEKS, MAX_WEEKS, MIN_WEEKS } from "@/lib/plan-generator";
import type { GoalKind, Zone } from "@/lib/types";
import { GOAL_DISTANCE, LEVEL_VDOT, LEVEL_WEEKLY_KM, predictRaceTime, vdotFromPerformance } from "@/lib/vdot";
import { useAppStore } from "@/store/app-store";
import { radius, space, useTheme, screenContent, fonts } from "@/theme";

const GOALS: GoalKind[] = ["5k", "10k", "half", "marathon", "fitness"];
const RESULT_DISTANCES = ["5k", "10k", "half", "marathon"] as const;
type ResultDistance = (typeof RESULT_DISTANCES)[number];
type Level = keyof typeof LEVEL_VDOT;
type Source = "current" | "result" | "level";
// Any Monday works: only the weekday names are read from it.
const REFERENCE_MONDAY = "2026-11-09";
const ZONES: Zone[] = ["easy", "marathon", "threshold", "interval"];

export function PlanSetup({ mode }: { mode: "first" | "edit" }) {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const existing = useAppStore((s) => s.plan);
  const currentVdot = useAppStore((s) => s.vdot);
  const createPlan = useAppStore((s) => s.createPlan);

  const [goal, setGoal] = useState<GoalKind>(existing?.input.goal ?? "10k");
  const [weeks, setWeeks] = useState(existing?.input.weeks ?? DEFAULT_WEEKS["10k"]);
  const [weeksTouched, setWeeksTouched] = useState(false);
  const [source, setSource] = useState<Source>(mode === "edit" && currentVdot != null ? "current" : "level");
  const [resultDistance, setResultDistance] = useState<ResultDistance>("5k");
  const [resultTime, setResultTime] = useState("");
  const [level, setLevel] = useState<Level>("casual");
  // Weekly volume is edited in the runner's own unit and stored in metres.
  const toUnits = (meters: number) => Math.round(meters / unitMeters(f.units));
  const [weekly, setWeekly] = useState(toUnits(existing ? existing.input.weeklyDistance : LEVEL_WEEKLY_KM.casual * 1000));
  const [runDays, setRunDays] = useState<number[]>(existing?.input.runDays ?? [1, 3, 6]);
  const [longDay, setLongDay] = useState(existing?.input.longRunDay ?? 6);
  const [strengthPerWeek, setStrengthPerWeek] = useState(existing?.input.strengthPerWeek ?? 1);
  const thisMonday = mondayOf(today);
  const lateInWeek = today >= addDays(thisMonday, 4);
  const [startNext, setStartNext] = useState(lateInWeek);

  const parsedTime = parseDuration(resultTime);
  const vdot = useMemo(() => {
    if (source === "current" && currentVdot != null) return currentVdot;
    if (source === "result") return parsedTime ? Math.round(vdotFromPerformance(GOAL_DISTANCE[resultDistance], parsedTime) * 10) / 10 : null;
    return LEVEL_VDOT[level];
  }, [source, currentVdot, parsedTime, resultDistance, level]);

  const startMonday = startNext ? addDays(thisMonday, 7) : thisMonday;
  const endDate = addDays(startMonday, (weeks - 1) * 7 + longDay);
  const daysError = runDays.length < 2 ? t.onboarding.tooFewDays : null;
  const resultError = source === "result" && resultTime.length > 0 && !parsedTime ? t.onboarding.resultInvalid : null;
  const canBuild = vdot != null && !daysError;

  const chooseGoal = (g: GoalKind) => {
    setGoal(g);
    if (!weeksTouched) setWeeks(DEFAULT_WEEKS[g]);
  };

  const toggleDay = (d: number) => {
    setRunDays((days) => {
      if (days.includes(d)) {
        const next = days.filter((x) => x !== d);
        if (d === longDay && next.length > 0) setLongDay(next[next.length - 1]);
        return next;
      }
      if (days.length >= 6) return days;
      return [...days, d].sort((a, b) => a - b);
    });
  };

  const build = () => {
    if (vdot == null || daysError) return;
    createPlan(
      {
        goal,
        runDays,
        longRunDay: runDays.includes(longDay) ? longDay : runDays[runDays.length - 1],
        weeks,
        startDate: startMonday,
        vdot,
        weeklyDistance: weekly * unitMeters(f.units),
        strengthPerWeek,
      },
      startNext ? undefined : today,
    );
    if (mode === "edit") router.back();
    else router.replace("/");
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ ...screenContent, gap: space.xl }}
    >
      <View style={{ gap: space.m }}>
        <Txt variant="title" accessibilityRole="header">
          {t.onboarding.goalTitle}
        </Txt>
        <Txt muted>{t.onboarding.goalHint}</Txt>
        <ChipRow>
          {GOALS.map((g) => (
            <Chip key={g} label={t.goal[g]} selected={goal === g} onPress={() => chooseGoal(g)} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: space.m }}>
        <Txt variant="title" accessibilityRole="header">
          {t.onboarding.fitnessTitle}
        </Txt>
        <View style={{ gap: space.s }}>
          {mode === "edit" && currentVdot != null ? (
            <Chip
              label={t.fitness.current(currentVdot.toFixed(1))}
              selected={source === "current"}
              onPress={() => setSource("current")}
              grow
            />
          ) : null}
          <Chip label={t.onboarding.haveResult} selected={source === "result"} onPress={() => setSource("result")} grow />
          <Chip label={t.onboarding.useLevel} selected={source === "level"} onPress={() => setSource("level")} grow />
        </View>

        {source === "result" ? (
          <Section style={{ padding: 16, gap: space.m }}>
            <View style={{ gap: space.s }}>
              <Txt variant="label">{t.onboarding.resultDistance}</Txt>
              <ChipRow>
                {RESULT_DISTANCES.map((d) => (
                  <Chip key={d} label={t.goal[d]} selected={resultDistance === d} onPress={() => setResultDistance(d)} />
                ))}
              </ChipRow>
            </View>
            <View style={{ gap: space.s }}>
              <Txt variant="label" nativeID="result-time-label">
                {t.onboarding.resultTime}
              </Txt>
              <TextInput
                value={resultTime}
                onChangeText={setResultTime}
                placeholder={t.onboarding.resultTimeHint}
                placeholderTextColor={theme.textMuted}
                keyboardType="numbers-and-punctuation"
                inputMode="text"
                autoCorrect={false}
                accessibilityLabelledBy="result-time-label"
                aria-label={t.onboarding.resultTime}
                style={{
                  minHeight: 48,
                  paddingHorizontal: 14,
                  borderRadius: radius.button,
                  backgroundColor: theme.surfaceAlt,
                  color: theme.text,
                  fontFamily: fonts.bold,
                  fontSize: 20,
                  fontVariant: ["tabular-nums"],
                }}
              />
              {resultError ? (
                <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite" selectable>
                  {resultError}
                </Txt>
              ) : null}
            </View>
          </Section>
        ) : null}

        {source === "level" ? (
          <View style={{ gap: space.s }}>
            <Txt variant="label">{t.onboarding.level}</Txt>
            {(
              [
                ["new", t.onboarding.levelNew, t.onboarding.levelNewHint],
                ["casual", t.onboarding.levelCasual, t.onboarding.levelCasualHint],
                ["regular", t.onboarding.levelRegular, t.onboarding.levelRegularHint],
              ] as const
            ).map(([key, label, hint]) => (
              <Chip
                key={key}
                label={label}
                hint={hint}
                selected={level === key}
                grow
                onPress={() => {
                  setLevel(key);
                  setWeekly(toUnits(LEVEL_WEEKLY_KM[key] * 1000));
                }}
              />
            ))}
          </View>
        ) : null}

        <Section style={{ padding: 16 }}>
          <Stepper
            label={t.onboarding.weekly}
            value={weekly}
            min={0}
            max={f.units === "km" ? 150 : 95}
            step={f.units === "km" ? 2 : 1}
            format={(v) => `${v} ${f.unit}`}
            onChange={setWeekly}
          />
        </Section>
      </View>

      <View style={{ gap: space.m }}>
        <Txt variant="title" accessibilityRole="header">
          {t.onboarding.scheduleTitle}
        </Txt>
        <Txt muted>{t.onboarding.scheduleHint}</Txt>
        <ChipRow>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Chip
              key={d}
              role="checkbox"
              label={f.weekdayShort(addDays(REFERENCE_MONDAY, d))}
              selected={runDays.includes(d)}
              onPress={() => toggleDay(d)}
              disabled={!runDays.includes(d) && runDays.length >= 6}
            />
          ))}
        </ChipRow>
        {daysError ? (
          <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite">
            {daysError}
          </Txt>
        ) : null}
        {runDays.length >= 6 ? (
          <Txt variant="caption" muted>
            {t.onboarding.tooManyDays}
          </Txt>
        ) : null}
        {runDays.length > 0 ? (
          <View style={{ gap: space.s }}>
            <Txt variant="label">{t.onboarding.longDay}</Txt>
            <ChipRow>
              {runDays.map((d) => (
                <Chip key={d} label={f.weekdayShort(addDays(REFERENCE_MONDAY, d))} selected={longDay === d} onPress={() => setLongDay(d)} />
              ))}
            </ChipRow>
          </View>
        ) : null}
      </View>

      <View style={{ gap: space.m }}>
        <Txt variant="title" accessibilityRole="header">
          {t.training.strengthPerWeek}
        </Txt>
        <Txt muted>{t.training.strengthHint}</Txt>
        <ChipRow>
          {[0, 1, 2].map((n) => (
            <Chip key={n} label={n === 0 ? t.training.strengthNone : String(n)} selected={strengthPerWeek === n} onPress={() => setStrengthPerWeek(n)} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: space.m }}>
        <Txt variant="title" accessibilityRole="header">
          {t.onboarding.lengthTitle}
        </Txt>
        <Section style={{ padding: 16, gap: space.m }}>
          <Stepper
            label={t.onboarding.lengthLabel}
            value={weeks}
            min={MIN_WEEKS}
            max={MAX_WEEKS}
            format={(v) => t.onboarding.weeks(v)}
            onChange={(v) => {
              setWeeks(v);
              setWeeksTouched(true);
            }}
          />
        </Section>
        <ChipRow>
          <Chip label={t.onboarding.startThisWeek} selected={!startNext} onPress={() => setStartNext(false)} />
          <Chip label={t.onboarding.startNextWeek} selected={startNext} onPress={() => setStartNext(true)} />
        </ChipRow>
        <Txt muted>{goal === "fitness" ? t.onboarding.endsOn(f.dayLong(endDate)) : t.onboarding.raceOn(f.dayLong(endDate))}</Txt>
      </View>

      {vdot != null ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.onboarding.summaryTitle}</SectionTitle>
          <Section>
            {ZONES.map((z) => (
              <View key={z} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
                <Txt>{t.zone[z]}</Txt>
                <Txt selectable style={{ fontVariant: ["tabular-nums"] }}>
                  {f.zoneRange(vdot, z, goal)} {f.perUnit}
                </Txt>
              </View>
            ))}
          </Section>
          {goal !== "fitness" ? (
            <View style={{ paddingHorizontal: 4, gap: 2 }}>
              <Txt variant="caption" muted>
                {t.onboarding.predicted} · {t.goal[goal]}
              </Txt>
              <Num size={40} selectable>
                {formatDuration(predictRaceTime(vdot, GOAL_DISTANCE[goal]))}
              </Num>
            </View>
          ) : null}
          <Txt variant="caption" muted style={{ paddingHorizontal: 4 }}>
            {t.onboarding.summaryHint}
          </Txt>
        </View>
      ) : null}

      <View style={{ gap: space.s }}>
        {mode === "edit" ? (
          <Txt variant="caption" muted style={{ textAlign: "center" }}>
            {t.onboarding.replaceWarning}
          </Txt>
        ) : null}
        <Button label={t.onboarding.build} onPress={build} disabled={!canBuild} />
      </View>
    </ScrollView>
  );
}
