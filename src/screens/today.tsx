import { router } from "expo-router";
import { Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { Row, Section, SectionTitle } from "@/components/section";
import { Num, Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useLocalized, useT } from "@/i18n";
import { EXERCISE_MAP } from "@/data/exercises";
import { routineDuration } from "@/lib/training";
import { findRoutine, useTrainingStore } from "@/store/training-store";
import { useStartRoutine } from "./training-shared";
import { missedWorkouts } from "@/lib/adapt";
import { addDays, fromDateKey, mondayOf } from "@/lib/dates";
import type { Workout } from "@/lib/types";
import { workoutDistance } from "@/lib/workouts";
import { useAppStore } from "@/store/app-store";
import { effortColor, radius, space, useTheme, screenContent } from "@/theme";
import { EffortMark, WorkoutCard } from "./workout-card";

export function TodayScreen() {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const plan = useAppStore((s) => s.plan);
  const vdot = useAppStore((s) => s.vdot) ?? 40;
  const activities = useAppStore((s) => s.activities);
  const hiddenUntil = useAppStore((s) => s.missedPromptHiddenUntil);
  const hideMissedPrompt = useAppStore((s) => s.hideMissedPrompt);
  const setVdot = useAppStore((s) => s.setVdot);
  const l = useLocalized();
  const customRoutines = useTrainingStore((s) => s.customRoutines);
  const startRoutine = useStartRoutine();

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
  const plannedDistance = weekWorkouts.filter((w) => w.status !== "skipped").reduce((sum, w) => sum + workoutDistance(w, vdot, goal), 0);
  const doneDistance = activities
    .filter((a) => {
      const key = fromDateKey(weekStart).getTime();
      return a.startedAt >= key && a.startedAt < key + 7 * 86_400_000;
    })
    .reduce((sum, a) => sum + a.distance, 0);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
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
        <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 20, gap: space.m }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s }}>
            <Icon name="rest" size={22} color={theme.field} />
            <Txt variant="title">{t.today.rest}</Txt>
          </View>
          <Txt muted>{notStarted ? t.today.notStarted(f.dayLong(plan.workouts[0].date)) : t.today.restHint}</Txt>
          {upcoming[0] ? (
            <Row
              title={`${t.today.nextUp}: ${t.workout[upcoming[0].type]}`}
              subtitle={`${f.dayLong(upcoming[0].date)} · ${f.distanceWithUnit(workoutDistance(upcoming[0], vdot, goal))}`}
              leading={<EffortMark type={upcoming[0].type} />}
              onPress={() => router.push({ pathname: "/workouts/[id]", params: { id: upcoming[0].id } })}
            />
          ) : null}
        </View>
      )}

      {strengthSlot && strengthRoutine ? (
        <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 20, gap: space.m }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s }}>
            <Icon name="strength" size={18} color={theme.track} />
            <Txt variant="label" color={theme.track}>
              {strengthSlot.status === "completed" ? t.today.completed : t.training.planned}
            </Txt>
          </View>
          <Txt variant="title">{l(strengthRoutine.name)}</Txt>
          <Txt muted>
            {t.training.exercisesCount(strengthRoutine.items.length)} · {t.training.estimate(Math.round(routineDuration(strengthRoutine, EXERCISE_MAP) / 60))}
          </Txt>
          {strengthSlot.status === "completed" && strengthSlot.sessionId ? (
            <Button
              label={t.training.summary}
              kind="secondary"
              onPress={() => router.push({ pathname: "/sessions/[id]", params: { id: strengthSlot.sessionId! } })}
            />
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

      <Button label={t.today.freeRun} kind="secondary" icon="run" onPress={() => router.push("/run")} />

      {!planDone ? (
        <View style={{ gap: space.m }}>
          <SectionTitle
            action={
              <Txt variant="caption" muted selectable>
                {t.today.weekProgress(f.distance(doneDistance, 1), f.distance(plannedDistance, 0), f.unit)}
              </Txt>
            }
          >
            {t.today.thisWeek}
          </SectionTitle>
          <WeekStrip days={weekDays} workouts={weekWorkouts} today={today} />
        </View>
      ) : null}

      {upcoming.length > 0 && !planDone ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.today.comingUp}</SectionTitle>
          <Section>
            {upcoming.slice(focus ? 0 : 1, (focus ? 0 : 1) + 3).map((w) => (
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
    </ScrollView>
  );
}

function WeekStrip({ days, workouts, today }: { days: string[]; workouts: Workout[]; today: string }) {
  const theme = useTheme();
  const t = useT();
  const f = useFormat();
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {days.map((day) => {
        const w = workouts.find((x) => x.date === day);
        const isToday = day === today;
        const missed = w && w.status === "planned" && day < today;
        const color = w ? effortColor(theme, w.type) : null;
        const status = !w
          ? t.today.rest
          : w.status === "completed"
            ? `${t.workout[w.type]}, ${t.today.completed}`
            : w.status === "skipped"
              ? `${t.workout[w.type]}, ${t.plan.skipped}`
              : missed
                ? `${t.workout[w.type]}, ${t.plan.missed}`
                : t.workout[w.type];
        const cell = (
          <View style={{ alignItems: "center", gap: 6, paddingVertical: 10 }}>
            <Txt variant="caption" muted={!isToday} color={isToday ? theme.track : undefined}>
              {f.weekdayShort(day).slice(0, 3)}
            </Txt>
            <Num size={22} color={isToday ? theme.track : theme.text}>
              {fromDateKey(day).getDate()}
            </Num>
            <View style={{ height: 20, justifyContent: "center" }}>
              {!w ? (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.separator }} />
              ) : w.status === "completed" ? (
                <Icon name="check" size={18} color={theme.field} />
              ) : w.status === "skipped" ? (
                <Icon name="skipped" size={18} color={theme.textMuted} />
              ) : missed ? (
                <Icon name="missed" size={18} color={theme.textMuted} />
              ) : (
                <View style={{ width: 16, height: 8, borderRadius: radius.lane, backgroundColor: color!.fill }} />
              )}
            </View>
          </View>
        );
        const base: ViewStyle = {
          flex: 1,
          minWidth: 40,
          borderRadius: radius.button,
          borderCurve: "continuous",
          backgroundColor: isToday ? theme.surface : "transparent",
        };
        if (!w) {
          return (
            <View key={day} style={base} accessible accessibilityLabel={`${f.dayLong(day)}: ${status}`}>
              {cell}
            </View>
          );
        }
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={`${f.dayLong(day)}: ${status}`}
            onPress={() => router.push({ pathname: "/workouts/[id]", params: { id: w.id } })}
            style={({ pressed }) => [base, { cursor: "pointer", backgroundColor: pressed ? theme.surfaceAlt : base.backgroundColor } as ViewStyle]}
          >
            {cell}
          </Pressable>
        );
      })}
    </View>
  );
}
