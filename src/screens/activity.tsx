import { router } from "expo-router";
import { FlatList, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Row } from "@/components/section";
import { useFormat } from "@/hooks/use-format";
import { useLocalized, useT } from "@/i18n";
import { Icon } from "@/components/icon";
import { sessionStats } from "@/lib/training";
import type { TrainingSession } from "@/lib/training-types";
import { useTrainingStore } from "@/store/training-store";
import type { SavedActivity } from "@/store/app-store";
import { formatDuration } from "@/lib/format";
import { averagePace } from "@/lib/run-engine";
import { useAppStore } from "@/store/app-store";
import { radius, useTheme, screenContent } from "@/theme";
import { EffortMark } from "./workout-card";

export function ActivityScreen() {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const activities = useAppStore((s) => s.activities);
  const sessions = useTrainingStore((s) => s.sessions);
  const l = useLocalized();
  type Item = { kind: "run"; at: number; run: SavedActivity } | { kind: "train"; at: number; session: TrainingSession };
  const items: Item[] = [
    ...activities.map((a): Item => ({ kind: "run", at: a.startedAt, run: a })),
    ...sessions.map((x): Item => ({ kind: "train", at: x.startedAt, session: x })),
  ].sort((a, b) => b.at - a.at);

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={screenContent}
      data={items}
      keyExtractor={(i) => (i.kind === "run" ? i.run.id : i.session.id)}
      ListEmptyComponent={
        <EmptyState icon="run" title={t.activity.empty} body={t.activity.emptyHint}>
          <Button label={t.today.freeRun} icon="play" onPress={() => router.push("/run")} />
        </EmptyState>
      }
      renderItem={({ item: entry, index }) => {
        const first = index === 0;
        const last = index === items.length - 1;
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
            {entry.kind === "run" ? (
              <Row
                title={`${entry.run.workoutType ? t.workout[entry.run.workoutType] : t.activity.freeRun} · ${f.distanceWithUnit(entry.run.distance, 2)}`}
                subtitle={`${f.dateTime(entry.run.startedAt)} · ${formatDuration(entry.run.duration)} · ${f.pace(averagePace(entry.run.distance, entry.run.duration * 1000))} ${f.perUnit}`}
                leading={entry.run.workoutType ? <EffortMark type={entry.run.workoutType} size={12} /> : <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: theme.separator }} />}
                onPress={() => router.push({ pathname: "/runs/[id]", params: { id: entry.run.id } })}
              />
            ) : (
              <Row
                title={l(entry.session.name)}
                subtitle={`${f.dateTime(entry.session.startedAt)} · ${formatDuration(sessionStats(entry.session).duration)} · ${sessionStats(entry.session).doneSets} ${t.training.setsDone.toLowerCase()}`}
                leading={<Icon name="strength" size={14} color={theme.textMuted} />}
                onPress={() => router.push({ pathname: "/sessions/[id]", params: { id: entry.session.id } })}
              />
            )}
          </View>
        );
      }}
    />
  );
}
