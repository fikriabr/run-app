import { router } from "expo-router";
import { FlatList, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Row } from "@/components/section";
import { useFormat } from "@/hooks/use-format";
import { useT } from "@/i18n";
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

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={screenContent}
      data={activities}
      keyExtractor={(a) => a.id}
      ListEmptyComponent={
        <EmptyState icon="run" title={t.activity.empty} body={t.activity.emptyHint}>
          <Button label={t.today.freeRun} icon="play" onPress={() => router.push("/run")} />
        </EmptyState>
      }
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === activities.length - 1;
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
            <Row
              title={`${item.workoutType ? t.workout[item.workoutType] : t.activity.freeRun} · ${f.distanceWithUnit(item.distance, 2)}`}
              subtitle={`${f.dateTime(item.startedAt)} · ${formatDuration(item.duration)} · ${f.pace(averagePace(item.distance, item.duration * 1000))} ${f.perUnit}`}
              leading={item.workoutType ? <EffortMark type={item.workoutType} size={12} /> : <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: theme.separator }} />}
              onPress={() => router.push({ pathname: "/runs/[id]", params: { id: item.id } })}
            />
          </View>
        );
      }}
    />
  );
}
