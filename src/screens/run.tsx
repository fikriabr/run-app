import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Linking, Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { LaneChart } from "@/components/lane-chart";
import { RouteMap } from "@/components/route-map";
import { Num, Txt } from "@/components/text";
import { useStepText } from "@/components/workout-steps";
import { useFormat } from "@/hooks/use-format";
import { useRunKeepAwake } from "@/hooks/use-keep-awake";
import { useT } from "@/i18n";
import { formatDuration, unitMeters } from "@/lib/format";
import { averagePace, currentPace, movingMs, stepProgress } from "@/lib/run-engine";
import { useAppStore } from "@/store/app-store";
import { useRunStore } from "@/store/run-store";
import { deliverCues, type CoachOptions } from "@/services/coach";
import { confirm } from "@/services/confirm";
import { checkPermission, requestPermission, startTracking, stopTracking } from "@/services/location";
import { radius, space, useTheme } from "@/theme";

export function RunScreen() {
  useRunKeepAwake();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const plan = useAppStore((s) => s.plan);
  const vdot = useAppStore((s) => s.vdot) ?? 40;
  const settings = useAppStore((s) => s.settings);
  const run = useRunStore((s) => s.run);
  const gps = useRunStore((s) => s.gps);
  const dispatch = useRunStore((s) => s.dispatch);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState<"metrics" | "map">("metrics");
  const workout = workoutId ? plan?.workouts.find((w) => w.id === workoutId) : undefined;
  const goal = plan?.input.goal ?? "10k";
  const { amount, target } = useStepText();

  const coachOptions: CoachOptions = { t, units: f.units, vdot, goal, voice: settings.voice, splitCues: settings.splitCues, paceCues: settings.paceCues };
  const coach = useRef(coachOptions);
  coach.current = coachOptions;

  const beginTracking = async (ask: boolean) => {
    const granted = (await checkPermission()) || (ask && (await requestPermission()));
    if (!granted) return;
    try {
      await startTracking({ title: t.run.freeRun, body: workout ? t.workout[workout.type] : t.run.gpsReady, color: theme.accent });
    } catch (e) {
      useRunStore.getState().setGps({ error: e instanceof Error ? e.message : String(e) });
    }
  };

  useEffect(() => {
    const store = useRunStore.getState();
    if (!store.run) {
      store.begin({ steps: workout?.steps ?? [], vdot, goal, splitUnit: unitMeters(f.units) }, workout?.id ?? null);
    }
    void beginTracking(true);

    const unsubscribe = useRunStore.subscribe((s) => {
      if (s.run && s.run.cues.length > 0) {
        const cues = s.run.cues;
        s.dispatch({ type: "drainCues" });
        deliverCues(cues, s.run, coach.current);
      }
    });
    return () => {
      unsubscribe();
      void stopTracking();
    };
    // Runs once per run screen; the workout and units are fixed for the life of a recording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = run?.status ?? "ready";
  const active = status === "running" || status === "paused";

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      useRunStore.getState().dispatch({ type: "tick", now: ts });
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    // Android back must not abandon a recording in progress.
    const sub = BackHandler.addEventListener("hardwareBackPress", () => active);
    return () => sub.remove();
  }, [active]);

  const points = useMemo(() => run?.points.slice() ?? [], [run?.points.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!run) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  const ms = movingMs(run, now);
  const pace = currentPace(run);
  const avg = averagePace(run.distance, ms);
  const step = run.steps[run.stepIndex];
  const nextStep = run.steps[run.stepIndex + 1];
  const progress = stepProgress(run, now);
  const range = run.paces[run.stepIndex];
  const offPace = pace != null && range && step?.kind !== "recover" ? (pace < range.fast * 0.97 ? "fast" : pace > range.slow * 1.03 ? "slow" : null) : null;

  const close = async () => {
    await stopTracking();
    useRunStore.getState().clear();
    // A run opened from a deep link has nothing to go back to.
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const finish = async () => {
    const current = useRunStore.getState().run;
    if (!current || current.distance < 100) {
      const discard = await confirm(t.run.tooShortTitle, t.run.tooShortBody, t.run.discard, t.run.keepGoing, true);
      if (discard) await close();
      return;
    }
    const ok = await confirm(t.run.finishTitle, t.run.finishBody, t.run.finish, t.run.keepGoing);
    if (!ok) return;
    dispatch({ type: "finish", now: Date.now() });
    await stopTracking();
    router.replace("/run-save");
  };

  const gpsLabel =
    gps.permission === "denied"
      ? t.run.permissionTitle
      : gps.accuracy == null
        ? t.run.gpsSearching
        : gps.accuracy > 25
          ? t.run.gpsWeak(Math.round(gps.accuracy))
          : t.run.gpsReady;
  const gpsGood = gps.accuracy != null && gps.accuracy <= 25;

  const remainingText = progress
    ? step.measure === "distance"
      ? progress.remaining >= 1000 || f.units === "mi"
        ? f.distanceWithUnit(progress.remaining, 2)
        : `${Math.round(progress.remaining)} m`
      : formatDuration(progress.remaining)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, gap: space.s }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 }} accessibilityLiveRegion="polite">
          <Icon name="gps" size={16} color={gpsGood ? theme.primary : theme.textMuted} />
          <Txt variant="label" muted numberOfLines={1}>
            {gpsLabel}
          </Txt>
        </View>
        <Segmented
          options={[
            ["metrics", t.run.metrics],
            ["map", t.run.map],
          ]}
          value={view}
          onChange={(v) => setView(v as "metrics" | "map")}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: space.l, flexGrow: 1 }}>
        <Txt variant="title">{workout ? t.workout[workout.type] : t.run.freeRun}</Txt>

        {gps.permission === "denied" ? (
          <View style={{ backgroundColor: theme.accentSoft, borderRadius: radius.section, padding: 16, gap: space.m }}>
            <Txt variant="heading" color={theme.accentText}>
              {t.run.permissionTitle}
            </Txt>
            <Txt>{t.run.permissionBody}</Txt>
            <Button label={t.run.permissionButton} onPress={() => void beginTracking(true)} />
            {process.env.EXPO_OS !== "web" ? <Button label={t.run.openSettings} kind="secondary" onPress={() => void Linking.openSettings()} /> : null}
          </View>
        ) : null}

        {run.steps.length > 0 ? (
          <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 16, gap: space.m }}>
            {step ? (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.m }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="heading">
                      {t.step[step.kind]}
                      {step.rep ? ` · ${t.stepRep(step.rep.index, step.rep.of)}` : ""}
                    </Txt>
                    <Txt variant="caption" muted>
                      {amount(step)} · {target(step, vdot, goal)}
                    </Txt>
                  </View>
                  {remainingText ? (
                    <View style={{ alignItems: "flex-end" }} accessible accessibilityLabel={`${remainingText} ${t.run.remaining}`}>
                      <Num size={34}>{remainingText}</Num>
                      <Txt variant="caption" muted>
                        {t.run.remaining}
                      </Txt>
                    </View>
                  ) : null}
                </View>
                <LaneChart steps={run.steps} vdot={vdot} goal={goal} height={36} activeIndex={run.stepIndex} activeProgress={progress?.fraction ?? 0} />
                <Txt variant="caption" muted>
                  {nextStep ? `${t.run.then}: ${t.step[nextStep.kind]} · ${amount(nextStep)}` : t.run.lastStep}
                </Txt>
              </>
            ) : (
              <Txt variant="heading" color={theme.primary}>
                {t.run.workoutDone}
              </Txt>
            )}
          </View>
        ) : null}

        {view === "map" ? <RouteMap points={points} height={260} follow accessibilityLabel={t.run.map} /> : null}

        <View style={{ gap: space.l }}>
          <View style={{ flexDirection: "row", gap: space.l }}>
            <BigMetric label={t.run.time} value={formatDuration(ms / 1000)} size={view === "map" ? 44 : 64} />
            <BigMetric label={`${t.run.distance} (${f.unit})`} value={f.distance(run.distance)} size={view === "map" ? 44 : 64} />
          </View>
          <View style={{ flexDirection: "row", gap: space.l }}>
            <BigMetric
              label={`${t.run.pace} (${f.perUnit})`}
              value={f.pace(pace)}
              size={view === "map" ? 36 : 48}
              color={offPace ? theme.accentText : undefined}
              note={offPace === "fast" ? t.cue.slowDown : offPace === "slow" ? t.cue.speedUp : undefined}
            />
            <BigMetric label={`${t.run.avgPace} (${f.perUnit})`} value={f.pace(avg)} size={view === "map" ? 36 : 48} />
          </View>
        </View>
        {status !== "ready" && !gps.background && process.env.EXPO_OS !== "web" ? (
          <Txt variant="caption" muted>
            {t.run.backgroundNote}
          </Txt>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: space.m, paddingHorizontal: 16 }}>
        {status === "ready" ? (
          <>
            <Button label={t.run.close} kind="secondary" onPress={() => void close()} style={{ flex: 1 }} />
            <Button
              label={t.run.start}
              icon="play"
              onPress={() => dispatch({ type: "start", now: Date.now() })}
              disabled={gps.permission !== "granted"}
              style={{ flex: 2, minHeight: 64 }}
            />
          </>
        ) : status === "running" ? (
          <>
            {step ? <Button label={t.run.skipStep} kind="secondary" icon="skip" onPress={() => dispatch({ type: "skipStep", now: Date.now() })} style={{ flex: 1, minHeight: 64 }} /> : null}
            <Button label={t.run.pause} icon="pause" onPress={() => dispatch({ type: "pause", now: Date.now() })} style={{ flex: 2, minHeight: 64 }} />
          </>
        ) : status === "paused" ? (
          <>
            <Button label={t.run.finish} kind="secondary" icon="stop" onPress={() => void finish()} style={{ flex: 1, minHeight: 64 }} />
            <Button label={t.run.resume} icon="play" onPress={() => dispatch({ type: "resume", now: Date.now() })} style={{ flex: 2, minHeight: 64 }} />
          </>
        ) : null}
      </View>
    </View>
  );
}

function BigMetric({ label, value, size, color, note }: { label: string; value: string; size: number; color?: string; note?: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0 }} accessible accessibilityLabel={`${label}: ${value}${note ? `. ${note}` : ""}`}>
      <Txt variant="caption" muted numberOfLines={1}>
        {label}
      </Txt>
      <Num size={size} color={color} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Num>
      {note ? (
        <Txt variant="label" color={color}>
          {note}
        </Txt>
      ) : null}
    </View>
  );
}

function Segmented({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: theme.surfaceAlt, borderRadius: radius.button, padding: 2 }} accessibilityRole="tablist">
      {options.map(([key, label]) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={{ minHeight: 44, minWidth: 64, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", borderRadius: radius.button - 2, backgroundColor: selected ? theme.surface : "transparent", cursor: "pointer" } as ViewStyle}
          >
            <Txt variant="label" muted={!selected}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
