import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { LaneChart } from "@/components/lane-chart";
import { Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Txt } from "@/components/text";
import { WorkoutSteps } from "@/components/workout-steps";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useT } from "@/i18n";
import { addDays, mondayOf } from "@/lib/dates";
import { workoutDistance, workoutDuration } from "@/lib/workouts";
import { useAppStore } from "@/store/app-store";
import { effortColor, space, useTheme, screenContent } from "@/theme";

export function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const plan = useAppStore((s) => s.plan);
  const vdot = useAppStore((s) => s.vdot) ?? 40;
  const setStatus = useAppStore((s) => s.setWorkoutStatus);
  const move = useAppStore((s) => s.moveWorkout);
  const workout = plan?.workouts.find((w) => w.id === id);

  if (!plan || !workout) {
    return <EmptyState icon="missed" title={t.common.errorTitle} body={t.workoutDetail.notFound} />;
  }

  const goal = plan.input.goal;
  const color = effortColor(theme, workout.type);
  const weekStart = mondayOf(workout.date);
  const canMove = workout.status === "planned" && workout.type !== "race";
  const canStart = workout.status === "planned" && workout.date >= addDays(today, -1) && workout.date <= addDays(today, 1);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Stack.Screen options={{ title: t.workout[workout.type] }} />
      <View style={{ gap: space.m }}>
        <Txt variant="label" color={color.fill}>
          {f.dayLong(workout.date)} · {t.common.week(workout.week + 1)}
        </Txt>
        <LaneChart steps={workout.steps} vdot={vdot} goal={goal} height={72} accessibilityLabel={t.workoutDetail.structure} />
        <View style={{ flexDirection: "row", gap: space.xl }}>
          <Stat label={t.workoutDetail.distance} value={f.distance(workoutDistance(workout, vdot, goal), 1)} unit={f.unit} size={32} />
          <Stat label={t.workoutDetail.duration} value={`~${f.minutes(workoutDuration(workout, vdot, goal))}`} size={32} />
        </View>
      </View>

      {canStart ? (
        <Button label={t.workoutDetail.start} icon="play" onPress={() => router.push({ pathname: "/run", params: { workoutId: workout.id } })} />
      ) : null}
      {workout.status === "completed" && workout.activityId ? (
        <Button label={t.workoutDetail.viewRun} kind="secondary" onPress={() => router.push({ pathname: "/runs/[id]", params: { id: workout.activityId! } })} />
      ) : null}

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.workoutDetail.why}</SectionTitle>
        <Txt>{t.purpose[workout.type]}</Txt>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.workoutDetail.structure}</SectionTitle>
        <Section style={{ padding: 16 }}>
          <WorkoutSteps steps={workout.steps} vdot={vdot} goal={goal} />
        </Section>
      </View>

      {canMove ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.workoutDetail.move}</SectionTitle>
          <ChipRow>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => {
              const date = addDays(weekStart, d);
              return (
                <Chip
                  key={d}
                  label={f.weekdayShort(date)}
                  selected={date === workout.date}
                  disabled={date < today}
                  onPress={() => move(workout.id, date)}
                />
              );
            })}
          </ChipRow>
          <Txt variant="caption" muted>
            {t.workoutDetail.moveHint}
          </Txt>
        </View>
      ) : null}

      {workout.status === "planned" ? (
        <Button label={t.workoutDetail.skip} kind="danger" icon="skipped" onPress={() => setStatus(workout.id, "skipped")} />
      ) : workout.status === "skipped" ? (
        <Button label={t.workoutDetail.unskip} kind="secondary" onPress={() => setStatus(workout.id, "planned")} />
      ) : null}
    </ScrollView>
  );
}
