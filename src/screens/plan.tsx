import { router } from "expo-router";
import { useState } from "react";
import { SectionList, View } from "react-native";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { Row } from "@/components/section";
import { Num, Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useT } from "@/i18n";
import { addDays } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import type { PlanWeek, Workout } from "@/lib/types";
import type { StrengthSlot } from "@/lib/training-types";
import { useLocalized } from "@/i18n";
import { findRoutine, useTrainingStore } from "@/store/training-store";
import { GOAL_DISTANCE, predictRaceTime } from "@/lib/vdot";
import { workoutDistance, workoutDuration } from "@/lib/workouts";
import { useAppStore } from "@/store/app-store";
import { radius, space, useTheme, screenContent } from "@/theme";
import { EffortMark } from "./workout-card";

export function PlanScreen() {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const plan = useAppStore((s) => s.plan);
  const vdot = useAppStore((s) => s.vdot) ?? 40;
  const [showPast, setShowPast] = useState(false);
  const l = useLocalized();
  const customRoutines = useTrainingStore((s) => s.customRoutines);
  if (!plan) return null;

  const goal = plan.input.goal;
  const currentWeek = plan.weeks.find((w) => today >= w.start && today <= addDays(w.start, 6)) ?? (today < plan.weeks[0].start ? plan.weeks[0] : plan.weeks[plan.weeks.length - 1]);
  const pastCount = plan.weeks.filter((w) => w.index < currentWeek.index).length;
  const visibleWeeks = showPast ? plan.weeks : plan.weeks.filter((w) => w.index >= currentWeek.index);
  type Item = { kind: "run"; id: string; date: string; workout: Workout } | { kind: "strength"; id: string; date: string; slot: StrengthSlot };
  const sections = visibleWeeks.map((week) => ({
    week,
    data: [
      ...plan.workouts.filter((w) => w.week === week.index).map((w): Item => ({ kind: "run", id: w.id, date: w.date, workout: w })),
      ...(plan.strength ?? []).filter((x) => x.week === week.index).map((x): Item => ({ kind: "strength", id: x.id, date: x.date, slot: x })),
    ].sort((a, b) => a.date.localeCompare(b.date) || (a.kind === "run" ? -1 : 1)),
  }));

  const statusIcon = (w: Workout) => {
    if (w.status === "completed") return <Icon name="check" size={20} color={theme.field} />;
    if (w.status === "skipped") return <Icon name="skipped" size={20} color={theme.textMuted} />;
    if (w.date < today) return <Icon name="missed" size={20} color={theme.textMuted} />;
    return null;
  };

  const header = (
    <View style={{ gap: space.l, paddingBottom: space.l }}>
      <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 20, gap: space.m }}>
        <Txt variant="label" muted>
          {t.common.weekOf(currentWeek.index + 1, plan.weeks.length)} · {t.phase[currentWeek.phase]}
        </Txt>
        <Txt variant="title">{t.goalPlan(t.goal[goal])}</Txt>
        {goal !== "fitness" ? (
          <View style={{ gap: 2 }}>
            <Txt variant="caption" muted>
              {t.plan.predicted} · {t.goal[goal]}
            </Txt>
            <Num size={40} selectable>
              {formatDuration(predictRaceTime(vdot, GOAL_DISTANCE[goal]))}
            </Num>
          </View>
        ) : null}
        <PhaseBar weeks={plan.weeks} current={currentWeek.index} />
        <Button label={t.plan.adjust} kind="secondary" onPress={() => router.push("/plan-setup")} />
      </View>
      {pastCount > 0 ? (
        <Button
          label={showPast ? t.plan.hidePast : t.plan.showPast(pastCount)}
          kind="plain"
          onPress={() => setShowPast((v) => !v)}
        />
      ) : null}
    </View>
  );

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={screenContent}
      sections={sections}
      keyExtractor={(w) => w.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) => (
        <View style={{ paddingTop: space.l, paddingBottom: space.s, paddingHorizontal: 4, gap: 2 }}>
          <Txt variant="heading" accessibilityRole="header" color={section.week.index === currentWeek.index ? theme.track : undefined}>
            {t.common.week(section.week.index + 1)}
          </Txt>
          <Txt variant="caption" muted>
            {t.plan.weekSummary(t.phase[section.week.phase], f.distance(section.week.targetDistance, 0), f.unit)}
          </Txt>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const first = index === 0;
        const last = index === section.data.length - 1;
        return (
          <View
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: first ? radius.section : 0,
              borderTopRightRadius: first ? radius.section : 0,
              borderBottomLeftRadius: last ? radius.section : 0,
              borderBottomRightRadius: last ? radius.section : 0,
              overflow: "hidden",
              borderTopWidth: first ? 0 : 0.5,
              borderTopColor: theme.separator,
            }}
          >
            {item.kind === "run" ? (
              <Row
                title={t.workout[item.workout.type]}
                subtitle={`${item.date === today ? t.plan.today : f.day(item.date)} · ${f.distanceWithUnit(workoutDistance(item.workout, vdot, goal))} · ~${f.minutes(workoutDuration(item.workout, vdot, goal))}`}
                leading={<EffortMark type={item.workout.type} size={12} />}
                trailing={statusIcon(item.workout)}
                onPress={() => router.push({ pathname: "/workouts/[id]", params: { id: item.id } })}
              />
            ) : (
              <Row
                title={l(findRoutine(item.slot.routineId, customRoutines)?.name ?? { en: "Strength", id: "Kekuatan" })}
                subtitle={`${item.date === today ? t.plan.today : f.day(item.date)} · ${t.training.category.strength}`}
                leading={<Icon name="strength" size={14} color={theme.textMuted} />}
                trailing={
                  item.slot.status === "completed" ? (
                    <Icon name="check" size={20} color={theme.field} />
                  ) : item.date < today ? (
                    <Icon name="missed" size={20} color={theme.textMuted} />
                  ) : null
                }
                onPress={() =>
                  item.slot.status === "completed" && item.slot.sessionId
                    ? router.push({ pathname: "/sessions/[id]", params: { id: item.slot.sessionId } })
                    : router.push({ pathname: "/routines/[id]", params: { id: item.slot.routineId, slot: item.slot.id } })
                }
              />
            )}
          </View>
        );
      }}
    />
  );
}

/** One lane block per week, tall in peak, short in taper: the plan's shape at a glance. */
function PhaseBar({ weeks, current }: { weeks: PlanWeek[]; current: number }) {
  const theme = useTheme();
  const max = Math.max(...weeks.map((w) => w.targetDistance), 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 40 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {weeks.map((w) => (
        <View
          key={w.index}
          style={{
            flex: 1,
            height: Math.max(6, (w.targetDistance / max) * 40),
            borderRadius: radius.lane,
            backgroundColor: w.index === current ? theme.track : w.index < current ? theme.field : theme.surfaceAlt,
          }}
        />
      ))}
    </View>
  );
}
