import { File, Paths } from "expo-file-system";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Banner, EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { RouteMap } from "@/components/route-map";
import { Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useT } from "@/i18n";
import { formatDuration } from "@/lib/format";
import { toGpx } from "@/lib/gpx";
import { averagePace } from "@/lib/run-engine";
import { useAppStore } from "@/store/app-store";
import { loadRoute } from "@/store/storage";
import { confirm } from "@/services/confirm";
import { radius, space, useTheme, screenContent } from "@/theme";

// Full splits are exactly 1 km or 1 mile; anything else is the final partial split.
const isPartial = (meters: number) => Math.abs(meters - 1000) > 1 && Math.abs(meters - 1609.344) > 1;

export function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const activity = useAppStore((s) => s.activities.find((a) => a.id === id));
  const plan = useAppStore((s) => s.plan);
  const deleteActivity = useAppStore((s) => s.deleteActivity);
  const points = useMemo(() => (id ? loadRoute(id) : []), [id]);
  const [exportError, setExportError] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!activity) return <EmptyState icon="missed" title={t.common.errorTitle} body={t.activity.notFound} />;

  const title = activity.workoutType ? t.workout[activity.workoutType] : t.activity.freeRun;
  const workout = activity.workoutId ? plan?.workouts.find((w) => w.id === activity.workoutId) : undefined;
  const splitPaces = activity.splits.map((s) => s.duration / (s.distance / 1000));
  const fastest = Math.min(...splitPaces);
  const slowest = Math.max(...splitPaces);
  const change = activity.fitnessChange;

  const exportGpx = async () => {
    setExportError(false);
    setExporting(true);
    try {
      const gpx = toGpx(activity, points, `${title} ${f.dateTime(activity.startedAt)}`);
      if (process.env.EXPO_OS === "web") {
        const url = URL.createObjectURL(new Blob([gpx], { type: "application/gpx+xml" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `langkah-${activity.id}.gpx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, `langkah-${activity.id}.gpx`);
        if (file.exists) file.delete();
        file.create();
        file.write(gpx);
        await Sharing.shareAsync(file.uri, { mimeType: "application/gpx+xml", UTI: "com.topografix.gpx" });
      }
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    if (!(await confirm(t.activity.deleteTitle, t.activity.deleteBody, t.common.delete, t.common.cancel, true))) return;
    router.back();
    deleteActivity(activity.id);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Stack.Screen options={{ title }} />
      <Txt variant="label" muted>
        {f.dateTime(activity.startedAt)}
      </Txt>

      {change ? (
        <Banner
          icon={change.to > change.from ? "up" : "down"}
          tone={change.to > change.from ? "good" : "attention"}
          title={t.you.reason[change.reason]}
          body={(change.to > change.from ? t.activity.fitnessUp : t.activity.fitnessDown)(change.from.toFixed(1), change.to.toFixed(1))}
        />
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: space.l, columnGap: space.xl }}>
        <Stat label={t.run.distance} value={f.distance(activity.distance)} unit={f.unit} size={36} />
        <Stat label={t.run.time} value={formatDuration(activity.duration)} size={36} />
        <Stat label={t.run.avgPace} value={f.pace(averagePace(activity.distance, activity.duration * 1000))} unit={f.perUnit} size={36} />
        <Stat label={t.activity.elevation} value={String(activity.elevationGain)} unit="m" size={36} />
        {activity.rpe != null ? <Stat label={t.activity.effort} value={`${activity.rpe}/10`} size={36} /> : null}
      </View>

      {points.length > 1 ? (
        <RouteMap points={points} height={240} accessibilityLabel={t.run.map} />
      ) : (
        <Txt variant="caption" muted>
          {t.activity.noRoute}
        </Txt>
      )}

      {activity.note ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.activity.note}</SectionTitle>
          <Txt selectable>{activity.note}</Txt>
        </View>
      ) : null}

      {activity.splits.length > 0 ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.activity.splits}</SectionTitle>
          <Section>
            {activity.splits.map((s, i) => {
              const pace = splitPaces[i];
              // Bar length shows relative speed: the fastest split fills the track.
              const share = slowest === fastest ? 1 : 0.35 + 0.65 * ((slowest - pace) / (slowest - fastest));
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: space.m, paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Txt variant="label" muted style={{ width: 40, fontVariant: ["tabular-nums"] }}>
                    {isPartial(s.distance) ? f.distance(s.distance, 2) : String(i + 1)}
                  </Txt>
                  <View style={{ flex: 1, height: 10, backgroundColor: theme.surfaceAlt, borderRadius: radius.lane }}>
                    <View style={{ width: `${share * 100}%`, height: 10, borderRadius: radius.lane, backgroundColor: pace === fastest ? theme.track : theme.field }} />
                  </View>
                  <Txt selectable style={{ width: 52, textAlign: "right", fontVariant: ["tabular-nums"] }}>
                    {f.pace(pace)}
                  </Txt>
                </View>
              );
            })}
          </Section>
        </View>
      ) : null}

      {workout && activity.stepResults && activity.stepResults.length > 0 ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.activity.steps}</SectionTitle>
          <Section>
            {activity.stepResults.map((r) => {
              const step = workout.steps[r.index];
              if (!step) return null;
              return (
                <View key={r.index} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, gap: space.m }}>
                  <Txt style={{ flex: 1 }}>
                    {t.step[step.kind]}
                    {step.rep ? ` ${t.stepRep(step.rep.index, step.rep.of)}` : ""}
                  </Txt>
                  <Txt muted selectable style={{ fontVariant: ["tabular-nums"] }}>
                    {f.distance(r.distance, 2)} {f.unit} · {f.pace(averagePace(r.distance, r.duration * 1000))}
                  </Txt>
                </View>
              );
            })}
          </Section>
        </View>
      ) : null}

      <View style={{ gap: space.s }}>
        {points.length > 1 ? <Button label={t.activity.export} kind="secondary" icon="share" loading={exporting} onPress={() => void exportGpx()} /> : null}
        {exportError ? (
          <Txt variant="caption" color={theme.track} accessibilityLiveRegion="polite">
            {t.activity.exportFailed}
          </Txt>
        ) : null}
        <Button label={t.common.delete} kind="danger" icon="trash" onPress={() => void remove()} />
      </View>
    </ScrollView>
  );
}
