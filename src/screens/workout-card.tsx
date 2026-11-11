import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/button";
import { LaneChart } from "@/components/lane-chart";
import { Num, Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useT } from "@/i18n";
import type { GoalKind, Workout } from "@/lib/types";
import { workoutDistance, workoutDuration } from "@/lib/workouts";
import { effortColor, radius, space, useTheme } from "@/theme";

export function EffortMark({ type, size = 10 }: { type: Workout["type"]; size?: number }) {
  const theme = useTheme();
  return <View style={{ width: size, height: size, borderRadius: radius.lane, backgroundColor: effortColor(theme, type).fill }} />;
}

/** The focal block on Today: what to run, what it looks like, and the start action. */
export function WorkoutCard({ workout, vdot, goal, showStart }: { workout: Workout; vdot: number; goal: GoalKind; showStart: boolean }) {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const distance = workoutDistance(workout, vdot, goal);
  const duration = workoutDuration(workout, vdot, goal);
  const color = effortColor(theme, workout.type);
  const done = workout.status === "completed";

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 20, gap: space.l }}>
      <View style={{ gap: space.s }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s }}>
          <EffortMark type={workout.type} />
          <Txt variant="label" color={color.fill}>
            {done ? t.today.completed : f.dayLong(workout.date)}
          </Txt>
        </View>
        <Txt variant="title">{t.workout[workout.type]}</Txt>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.l, flexWrap: "wrap" }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Num size={40} selectable>
            {f.distance(distance, 1)}
          </Num>
          <Txt muted>{f.unit}</Txt>
        </View>
        <Txt muted>~{f.minutes(duration)}</Txt>
      </View>

      <LaneChart
        steps={workout.steps}
        vdot={vdot}
        goal={goal}
        accessibilityLabel={`${t.workout[workout.type]}, ${f.distanceWithUnit(distance)}`}
      />

      <View style={{ gap: space.s }}>
        {showStart && !done ? (
          <Button label={t.today.start} icon="play" onPress={() => router.push({ pathname: "/run", params: { workoutId: workout.id } })} />
        ) : null}
        <Button
          label={done && workout.activityId ? t.workoutDetail.viewRun : t.workoutDetail.structure}
          kind="secondary"
          onPress={() =>
            done && workout.activityId
              ? router.push({ pathname: "/runs/[id]", params: { id: workout.activityId } })
              : router.push({ pathname: "/workouts/[id]", params: { id: workout.id } })
          }
        />
      </View>
    </View>
  );
}
