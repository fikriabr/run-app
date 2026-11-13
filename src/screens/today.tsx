import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polygon } from "react-native-svg";
import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { Icon, type IconName } from "@/components/icon";
import { Row, Section, SectionTitle } from "@/components/section";
import { Txt } from "@/components/text";
import { type DayItem, WeekRings } from "@/components/week-rings";
import { EXERCISE_MAP } from "@/data/exercises";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useLocalized, useT } from "@/i18n";
import { missedWorkouts } from "@/lib/adapt";
import { addDays, fromDateKey, mondayOf } from "@/lib/dates";
import { routineDuration } from "@/lib/training";
import { isQuality, workoutDistance } from "@/lib/workouts";
import { useAppStore } from "@/store/app-store";
import { useRunStore } from "@/store/run-store";
import { clearLastCrash, readLastCrash } from "@/services/crash-log";
import { Share } from "react-native";
import { findRoutine, useTrainingStore } from "@/store/training-store";
import { fonts, radius, screenContent, space, useResolvedScheme, useTheme } from "@/theme";
import { useStartRoutine } from "./training-shared";
import { EffortMark, WorkoutCard } from "./workout-card";

export function TodayScreen() {
  const t = useT();
  const f = useFormat();
  const l = useLocalized();
  const theme = useTheme();
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const plan = useAppStore((s) => s.plan);
  const vdot = useAppStore((s) => s.vdot) ?? 40;
  const activities = useAppStore((s) => s.activities);
  const hiddenUntil = useAppStore((s) => s.missedPromptHiddenUntil);
  const hideMissedPrompt = useAppStore((s) => s.hideMissedPrompt);
  const setVdot = useAppStore((s) => s.setVdot);
  const customRoutines = useTrainingStore((s) => s.customRoutines);
  const startRoutine = useStartRoutine();
  const pendingRun = useRunStore((s) => (s.restored ? s.run : null));
  const pendingWorkoutId = useRunStore((s) => s.workoutId);
  const [lastCrash, setLastCrash] = useState(() => readLastCrash());

  // The navy hero needs light status-bar content while this tab is showing.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle(scheme === "dark" ? "light" : "dark");
    }, [scheme]),
  );

  if (!plan) return null;
  const goal = plan.input.goal;
  const todays = plan.workouts.filter((w) => w.date === today);
  const focus = todays.find((w) => w.status === "planned") ?? todays[0];
  const upcoming = plan.workouts.filter((w) => w.date > today && w.status === "planned");
  const lastDate = plan.workouts[plan.workouts.length - 1]?.date;
  const planDone = lastDate != null && lastDate < today;
  const notStarted = plan.workouts[0] != null && plan.workouts[0].date > addDays(mondayOf(today), 6);
  const missed = missedWorkouts(plan, today);
  const showMissed = missed.length >= 2 && !(hiddenUntil && hiddenUntil >= today);

  const strengthSlot = plan.strength?.find((x) => x.date === today && x.status !== "skipped");
  const strengthRoutine = findRoutine(strengthSlot?.routineId, customRoutines);
  const weekStart = mondayOf(today);
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map((d) => addDays(weekStart, d));
  const weekWorkouts = plan.workouts.filter((w) => w.date >= weekStart && w.date <= weekDays[6]);
  const weekStrength = (plan.strength ?? []).filter((x) => x.date >= weekStart && x.date <= weekDays[6]);
  const plannedDistance = weekWorkouts.filter((w) => w.status !== "skipped").reduce((sum, w) => sum + workoutDistance(w, vdot, goal), 0);
  const weekStartMs = fromDateKey(weekStart).getTime();
  const doneDistance = activities
    .filter((a) => a.startedAt >= weekStartMs && a.startedAt < weekStartMs + 7 * 86_400_000)
    .reduce((sum, a) => sum + a.distance, 0);
  const currentWeek = plan.weeks.find((w) => today >= w.start && today <= addDays(w.start, 6));

  const dayItems: Record<string, DayItem[]> = {};
  for (const w of weekWorkouts) {
    if (w.status === "skipped") continue;
    (dayItems[w.date] ??= []).push({ kind: isQuality(w.type) ? "hard" : "easy", done: w.status === "completed" });
  }
  for (const s of weekStrength) {
    if (s.status === "skipped") continue;
    (dayItems[s.date] ??= []).push({ kind: "strength", done: s.status === "completed" });
  }

  const openDay = (day: string) => {
    const run = weekWorkouts.find((w) => w.date === day);
    if (run) router.push({ pathname: "/workouts/[id]", params: { id: run.id } });
    else router.push("/plan");
  };

  const fabBottom = process.env.EXPO_OS === "ios" ? insets.bottom + 64 : 20;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ backgroundColor: theme.navy, paddingTop: insets.top + 8, paddingBottom: 72 }}>
          <View style={{ ...screenContent, paddingBottom: 0, gap: space.l }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <HeroIconButton icon="settings" label={t.you.settings} onPress={() => router.push("/settings")} />
              <Txt accessibilityRole="header" style={{ fontFamily: fonts.heavy, fontSize: 26, letterSpacing: 1.5, color: theme.onNavy }}>
                LANGKAH
              </Txt>
              <Pressable
                onPress={() => router.push("/run")}
                accessibilityRole="button"
                accessibilityLabel={t.today.freeRun}
                style={({ pressed }) =>
                  ({ minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: theme.accent, justifyContent: "center", opacity: pressed ? 0.85 : 1, cursor: "pointer" }) as ViewStyle
                }
              >
                <Txt variant="label" color={theme.onAccent} style={{ fontSize: 14 }}>
                  {t.today.freeRun}
                </Txt>
              </Pressable>
            </View>
            <View style={{ gap: 2 }}>
              <Txt variant="caption" color={theme.navyMuted}>
                {f.dayLong(today)}
              </Txt>
              <Txt variant="display" color={theme.onNavy}>
                {currentWeek ? `${t.common.weekOf(currentWeek.index + 1, plan.weeks.length)}` : t.goalPlan(t.goal[goal])}
              </Txt>
              {currentWeek ? (
                <Txt variant="body" color={theme.navyMuted}>
                  {t.goalPlan(t.goal[goal])} · {t.phase[currentWeek.phase]}
                </Txt>
              ) : null}
            </View>
          </View>
        </View>

        <View style={{ marginTop: -56 }}>
          <Stripes navy={theme.navy} accent={theme.accent} />
          <View style={{ ...screenContent, paddingTop: 0, gap: space.l }}>
            <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", overflow: "hidden" }}>
              <View style={{ padding: 16, paddingBottom: 8, gap: space.m }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
                  <Txt variant="title" accessibilityRole="header">
                    {t.today.thisWeek}
                  </Txt>
                  <HeroIconButton icon="plan" label={t.tabs.plan} onPress={() => router.push("/plan")} tint={theme.primary} />
                </View>
                <WeekRings
                  days={weekDays}
                  today={today}
                  items={dayItems}
                  weekdayLetter={(d) => f.weekdayShort(d).slice(0, 1).toUpperCase()}
                  dayLabel={(d, items) =>
                    `${f.dayLong(d)}: ${items.length === 0 ? t.today.rest : `${items.filter((i) => i.done).length}/${items.length} ${t.today.completed.toLowerCase()}`}`
                  }
                  onPressDay={openDay}
                />
              </View>
              <SummaryRow
                icon="run"
                tint={theme.primary}
                soft={theme.primarySoft}
                label={t.today.weekDistance}
                value={`${f.distance(doneDistance, 1)} / ${f.distance(plannedDistance, 0)} ${f.unit}`}
              />
              {weekStrength.length > 0 ? (
                <SummaryRow
                  icon="strength"
                  tint={theme.text}
                  soft={theme.yellowSoft}
                  label={t.today.weekStrength}
                  value={`${weekStrength.filter((s) => s.status === "completed").length} / ${weekStrength.length}`}
                />
              ) : null}
            </View>

            {lastCrash ? (
              <Banner icon="missed" tone="attention" title={t.crash.lastTitle} body={t.crash.lastBody}>
                <Txt variant="caption" selectable numberOfLines={4}>
                  {lastCrash.message}
                </Txt>
                <View style={{ flexDirection: "row", gap: space.s, flexWrap: "wrap" }}>
                  <Button
                    label={t.crash.share}
                    onPress={() => void Share.share({ message: `${lastCrash.message}\n\n${lastCrash.stack ?? ""}` })}
                    style={{ flexGrow: 1 }}
                  />
                  <Button
                    label={t.crash.dismiss}
                    kind="secondary"
                    onPress={() => {
                      clearLastCrash();
                      setLastCrash(null);
                    }}
                    style={{ flexGrow: 1 }}
                  />
                </View>
              </Banner>
            ) : null}

            {pendingRun ? (
              <Banner
                icon="run"
                tone="attention"
                title={t.today.unfinishedTitle}
                body={t.today.unfinishedBody(f.distanceWithUnit(pendingRun.distance, 2))}
              >
                <View style={{ flexDirection: "row", gap: space.s, flexWrap: "wrap" }}>
                  {pendingRun.status === "finished" ? (
                    <Button label={t.save.save} onPress={() => router.push("/run-save")} style={{ flexGrow: 1 }} />
                  ) : (
                    <Button
                      label={t.today.unfinishedResume}
                      icon="play"
                      onPress={() => router.push(pendingWorkoutId ? { pathname: "/run", params: { workoutId: pendingWorkoutId } } : "/run")}
                      style={{ flexGrow: 1 }}
                    />
                  )}
                  <Button label={t.run.discard} kind="secondary" onPress={() => useRunStore.getState().clear()} style={{ flexGrow: 1 }} />
                </View>
              </Banner>
            ) : null}

            {showMissed ? (
              <Banner icon="missed" tone="attention" title={t.today.missedTitle(missed.length)} body={t.today.missedBody}>
                <View style={{ flexDirection: "row", gap: space.s, flexWrap: "wrap" }}>
                  <Button
                    label={t.today.missedEase}
                    onPress={() => {
                      setVdot(vdot - 1, "missedWorkouts");
                      hideMissedPrompt(addDays(today, 14));
                    }}
                    style={{ flexGrow: 1 }}
                  />
                  <Button label={t.today.missedKeep} kind="secondary" onPress={() => hideMissedPrompt(addDays(today, 7))} style={{ flexGrow: 1 }} />
                </View>
              </Banner>
            ) : null}

            {planDone ? (
              <Banner icon="check" tone="good" title={t.today.planDone} body={t.today.planDoneHint}>
                <Button label={t.today.newPlan} onPress={() => router.push("/plan-setup")} />
              </Banner>
            ) : focus ? (
              <WorkoutCard workout={focus} vdot={vdot} goal={goal} showStart />
            ) : (
              <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", padding: 20, gap: space.m }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.s }}>
                  <Icon name="rest" size={22} color={theme.primary} />
                  <Txt variant="title">{t.today.rest}</Txt>
                </View>
                <Txt muted>{notStarted ? t.today.notStarted(f.dayLong(plan.workouts[0].date)) : t.today.restHint}</Txt>
                {upcoming[0] ? (
                  <Button
                    label={`${t.today.nextUp}: ${t.workout[upcoming[0].type]}`}
                    kind="secondary"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => router.push({ pathname: "/workouts/[id]", params: { id: upcoming[0].id } })}
                  />
                ) : null}
              </View>
            )}

            {strengthSlot && strengthRoutine ? (
              <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", padding: 20, gap: space.m }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.s }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.yellowSoft, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="strength" size={16} color={theme.text} />
                  </View>
                  <Txt variant="label" muted>
                    {strengthSlot.status === "completed" ? t.today.completed : t.training.planned}
                  </Txt>
                </View>
                <Txt variant="title">{l(strengthRoutine.name)}</Txt>
                <Txt muted>
                  {t.training.exercisesCount(strengthRoutine.items.length)} · {t.training.estimate(Math.round(routineDuration(strengthRoutine, EXERCISE_MAP) / 60))}
                </Txt>
                {strengthSlot.status === "completed" && strengthSlot.sessionId ? (
                  <Button label={t.training.summary} kind="secondary" onPress={() => router.push({ pathname: "/sessions/[id]", params: { id: strengthSlot.sessionId! } })} />
                ) : (
                  <Button
                    label={t.training.startRoutine}
                    kind={focus && focus.status === "planned" ? "secondary" : "primary"}
                    icon="strength"
                    onPress={() => void startRoutine(strengthRoutine.id, strengthSlot.id)}
                  />
                )}
              </View>
            ) : null}

            {upcoming.length > 0 && !planDone ? (
              <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", paddingTop: 20, overflow: "hidden" }}>
                <View style={{ paddingHorizontal: 16 }}>
                  <SectionTitle action={<Button label={t.today.viewAll} kind="plain" onPress={() => router.push("/plan")} style={{ minHeight: 44, paddingHorizontal: 4 }} />}>
                    {t.today.comingUp}
                  </SectionTitle>
                </View>
                <Section style={{ borderRadius: 0 }}>
                  {upcoming.slice(0, 3).map((w) => (
                    <Row
                      key={w.id}
                      title={t.workout[w.type]}
                      subtitle={`${f.day(w.date)} · ${f.distanceWithUnit(workoutDistance(w, vdot, goal))}`}
                      leading={<EffortMark type={w.type} />}
                      onPress={() => router.push({ pathname: "/workouts/[id]", params: { id: w.id } })}
                    />
                  ))}
                </Section>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push("/quick-start")}
        accessibilityRole="button"
        accessibilityLabel={t.quickStart.title}
        style={({ pressed }) =>
          ({
            position: "absolute",
            right: 20,
            bottom: fabBottom,
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.accent,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 16px rgba(214, 48, 49, 0.35)",
            transform: [{ scale: pressed ? 0.95 : 1 }],
            cursor: "pointer",
          }) as ViewStyle
        }
      >
        <Icon name="plus" size={30} color={theme.onAccent} />
      </Pressable>
    </View>
  );
}

function HeroIconButton({ icon, label, onPress, tint }: { icon: IconName; label: string; onPress: () => void; tint?: string }) {
  const theme = useTheme();
  const onHero = tint == null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) =>
        ({
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: onHero ? (pressed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)") : pressed ? theme.primarySoft : "transparent",
          cursor: "pointer",
        }) as ViewStyle
      }
    >
      <Icon name={icon} size={22} color={tint ?? theme.onNavy} />
    </Pressable>
  );
}

function SummaryRow({ icon, tint, soft, label, value }: { icon: IconName; tint: string; soft: string; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.m, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.separator }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={18} color={tint} />
      </View>
      <Txt variant="heading" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="heading" selectable style={{ fontVariant: ["tabular-nums"] }}>
        {value}
      </Txt>
    </View>
  );
}

/** The navy band breaking into a red lane line behind the first card: the hero's diagonal edge. */
function Stripes({ navy, accent }: { navy: string; accent: string }) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 400 420" preserveAspectRatio="none">
        <Polygon points="0,0 400,0 400,200 0,40" fill={navy} />
        <Polygon points="0,150 0,190 70,260 110,260" fill={accent} />
        <Polygon points="260,300 330,300 400,360 400,420" fill={navy} />
      </Svg>
    </View>
  );
}
