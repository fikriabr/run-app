import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, TextInput, View, type ViewStyle } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Icon, type IconName } from "@/components/icon";
import { RestBar } from "@/components/rest-bar";
import { Txt } from "@/components/text";
import { TopTabs } from "@/components/top-tabs";
import { EXERCISE_MAP } from "@/data/exercises";
import { useWeight } from "@/hooks/use-weight";
import { useLocalized, useT } from "@/i18n";
import { exerciseBests, isPersonalBest, previousSets } from "@/lib/training";
import type { Exercise, LoggedSet } from "@/lib/training-types";
import { useActiveSession, useTrainingStore } from "@/store/training-store";
import { fonts, radius, space, useTheme } from "@/theme";
import { ExerciseHero, ExerciseHistoryView, ExerciseHowTo, useExerciseVideo, VideoOptions } from "./exercise-sections";
import { sessionColumn } from "./session";

type Tab = "track" | "howto" | "history";

export function SessionExerciseScreen() {
  const { index } = useLocalSearchParams<{ index: string }>();
  // Keyed so moving to the next exercise starts on the Track tab with fresh local state.
  return <SessionExercise key={index} idx={Number(index)} />;
}

function SessionExercise({ idx }: { idx: number }) {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const active = useActiveSession((s) => s.active);
  const history = useTrainingStore((s) => s.sessions);
  const [tab, setTab] = useState<Tab>("track");
  const exercise = active?.exercises[idx];
  const info = exercise ? EXERCISE_MAP[exercise.exerciseId] : undefined;
  const { video } = useExerciseVideo(info ?? ({ id: "" } as Exercise));
  const previous = useMemo(() => (info ? previousSets(history, info.id) : []), [history, info]);
  const bests = useMemo(() => (info ? exerciseBests(history, info.id) : null), [history, info]);

  if (!active || !exercise || !info || !bests) {
    return <EmptyState icon="strength" title={t.training.sessionNotFound} body={t.training.noRecent} />;
  }

  const timed = info.measure === "time";
  const target = exercise.sets[0];
  const targetText = timed ? t.training.targetSecondsLine(target?.seconds ?? 0) : t.training.targetRepsLine(target?.reps ?? 0);
  const restText = exercise.restSeconds > 0 ? t.training.restLine(exercise.restSeconds) : "";
  const canComplete = exercise.sets.some((s) => (s.reps ?? 0) > 0 || (s.seconds ?? 0) > 0);
  const next = active.exercises.findIndex((e, k) => k !== idx && e.sets.some((s) => !s.done));
  const nextInfo = next >= 0 ? EXERCISE_MAP[active.exercises[next].exerciseId] : undefined;

  const complete = () => {
    useActiveSession.getState().completeExercise(idx, Date.now());
    if (process.env.EXPO_OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (next >= 0) router.replace({ pathname: "/session/[index]", params: { index: String(next) } });
    else router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: l(active.name) }} />
      <TopTabs
        tabs={[
          ["track", t.training.tabTrack],
          ["howto", t.training.tabHowTo],
          ["history", t.training.tabHistory],
        ]}
        value={tab}
        onChange={setTab}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 140 }}>
        <ExerciseHero exercise={info} subtitle={[targetText, restText].filter(Boolean).join("   ·   ")}>
          <View style={{ flexDirection: "row", gap: space.m, marginTop: space.s }}>
            <RoundAction
              icon="timer"
              label={t.training.startRest}
              disabled={exercise.restSeconds <= 0}
              onPress={() => useActiveSession.getState().startRest(exercise.restSeconds, Date.now())}
            />
            <RoundAction icon="book" label={t.training.openInfo} onPress={() => setTab("howto")} />
            {video ? (
              <RoundAction icon="video" label={t.training.watchOnYouTube} onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)} />
            ) : null}
          </View>
        </ExerciseHero>

        <View style={{ ...sessionColumn, gap: space.m }}>
          {tab === "track" ? (
            <>
              {exercise.sets.map((set, i) => (
                <SetCard
                  key={i}
                  exercise={info}
                  set={set}
                  index={i}
                  previous={previous[Math.min(i, previous.length - 1)]}
                  best={isPersonalBest(set, bests)}
                  onToggle={() => useActiveSession.getState().toggleDone(idx, i, Date.now())}
                  onChange={(patch) => useActiveSession.getState().updateSet(idx, i, patch)}
                />
              ))}

              <View style={{ flexDirection: "row", gap: space.s }}>
                <CardButton icon="plus" label={t.training.addSet} onPress={() => useActiveSession.getState().addSet(idx)} />
                {exercise.sets.length > 1 ? (
                  <CardButton icon="minus" label={t.training.removeSet(exercise.sets.length)} onPress={() => useActiveSession.getState().removeSet(idx, exercise.sets.length - 1)} />
                ) : null}
              </View>

              <Txt variant="caption" muted style={{ textAlign: "center", marginTop: space.s }}>
                {nextInfo ? t.training.nextExercise(l(nextInfo.name)) : t.training.allDone}
              </Txt>
              <Button label={t.training.completeExercise} icon="tick" disabled={!canComplete} onPress={complete} />
            </>
          ) : tab === "howto" ? (
            <View style={{ gap: space.xl }}>
              <ExerciseHowTo exercise={info} />
              <VideoOptions exercise={info} />
            </View>
          ) : (
            <ExerciseHistoryView exercise={info} />
          )}
        </View>
      </ScrollView>
      <RestBar />
    </View>
  );
}

function SetCard({
  exercise,
  set,
  index,
  previous,
  best,
  onToggle,
  onChange,
}: {
  exercise: Exercise;
  set: LoggedSet;
  index: number;
  previous?: LoggedSet;
  best: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<LoggedSet>) => void;
}) {
  const t = useT();
  const l = useLocalized();
  const w = useWeight();
  const theme = useTheme();
  const timed = exercise.measure === "time";
  const name = l(exercise.name);

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", padding: 14, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.m }}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.done }}
          accessibilityLabel={set.done ? t.training.markUndone(index + 1) : t.training.markDone(index + 1)}
          style={({ pressed }) =>
            ({
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: set.done ? theme.primary : pressed ? theme.separator : theme.surfaceAlt,
              cursor: "pointer",
            }) as ViewStyle
          }
        >
          {set.done ? (
            <Icon name="tick" size={22} color={theme.onPrimary} />
          ) : (
            <Txt variant="heading" style={{ fontFamily: fonts.heavy, fontSize: 18 }}>
              {index + 1}
            </Txt>
          )}
        </Pressable>
        {exercise.weighted ? (
          <ValueBox
            label={`${name} ${t.training.set} ${index + 1} ${w.unit}`}
            unit={w.unit}
            value={w.show(set.weight)}
            decimal
            onCommit={(text) => onChange({ weight: w.parse(text) })}
          />
        ) : null}
        <ValueBox
          label={`${name} ${t.training.set} ${index + 1} ${timed ? t.training.secUnit : t.training.repsUnit}`}
          unit={timed ? t.training.secUnit : t.training.repsUnit}
          value={String((timed ? set.seconds : set.reps) ?? "")}
          onCommit={(text) => {
            const n = text.trim() === "" ? null : Math.max(0, Math.round(Number(text)));
            const value = n != null && Number.isFinite(n) ? n : null;
            onChange(timed ? { seconds: value } : { reps: value });
          }}
        />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.m, paddingLeft: 60 }}>
        {exercise.weighted ? (
          <LastLine text={previous?.weight != null ? t.training.last(`${w.show(previous.weight)} ${w.unit}`) : t.training.lastNone} />
        ) : null}
        <LastLine
          text={
            previous
              ? t.training.last(timed ? t.training.secondsShort(previous.seconds ?? 0) : t.training.repsShort(previous.reps ?? 0))
              : exercise.weighted
                ? ""
                : t.training.lastNone
          }
        />
      </View>
      {best ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginLeft: 60, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: theme.yellowSoft }}>
          <Icon name="up" size={14} color={theme.text} />
          <Txt variant="label">{t.training.personalBest}</Txt>
        </View>
      ) : null}
    </View>
  );
}

function LastLine({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, minHeight: 18 }}>
      {text ? <Icon name="history" size={12} color={theme.textMuted} /> : null}
      <Txt variant="caption" muted numberOfLines={1}>
        {text}
      </Txt>
    </View>
  );
}

/** Keeps its own text while focused so "12." can be typed on the way to "12.5". */
function ValueBox({ value, unit, onCommit, decimal, label }: { value: string; unit: string; onCommit: (text: string) => void; decimal?: boolean; label: string }) {
  const theme = useTheme();
  // A draft exists only while the field is focused; otherwise the stored value shows.
  const [draft, setDraft] = useState<string | null>(null);
  const focused = draft != null;
  const text = draft ?? value;
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        padding: 6,
        paddingRight: 12,
        borderRadius: radius.button,
        backgroundColor: theme.primarySoft,
        borderWidth: 2,
        borderColor: focused ? theme.primary : "transparent",
      }}
    >
      <TextInput
        value={text}
        onChangeText={setDraft}
        onFocus={() => setDraft(value)}
        onBlur={() => {
          onCommit(text);
          setDraft(null);
        }}
        onSubmitEditing={() => onCommit(text)}
        keyboardType={decimal ? "decimal-pad" : "number-pad"}
        inputMode={decimal ? "decimal" : "numeric"}
        selectTextOnFocus
        returnKeyType="done"
        aria-label={label}
        style={{
          flex: 1,
          minWidth: 0,
          height: 44,
          borderRadius: 8,
          backgroundColor: theme.surface,
          color: theme.text,
          fontFamily: fonts.heavy,
          fontSize: 20,
          textAlign: "center",
          fontVariant: ["tabular-nums"],
        }}
      />
      <Txt variant="label" muted>
        {unit}
      </Txt>
    </View>
  );
}

function RoundAction({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) =>
        ({
          width: 64,
          height: 48,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? theme.separator : theme.primarySoft,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }) as ViewStyle
      }
    >
      <Icon name={icon} size={22} color={theme.primary} />
    </Pressable>
  );
}

function CardButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) =>
        ({
          flex: 1,
          minHeight: 56,
          borderRadius: radius.card,
          backgroundColor: pressed ? theme.primarySoft : theme.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space.s,
          cursor: "pointer",
        }) as ViewStyle
      }
    >
      <Icon name={icon} size={18} color={theme.primary} />
      <Txt variant="heading" color={theme.primary}>
        {label}
      </Txt>
    </Pressable>
  );
}
