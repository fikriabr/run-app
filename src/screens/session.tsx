import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Icon, type IconName } from "@/components/icon";
import { Num, Txt } from "@/components/text";
import { EXERCISE_MAP } from "@/data/exercises";
import { useWeight } from "@/hooks/use-weight";
import { useLocalized, useT } from "@/i18n";
import { formatDuration } from "@/lib/format";
import { previousSets, sessionStats } from "@/lib/training";
import type { LoggedSet, SessionExercise } from "@/lib/training-types";
import { useAppStore } from "@/store/app-store";
import { useActiveSession, useTrainingStore } from "@/store/training-store";
import { confirm } from "@/services/confirm";
import { radius, screenContent, space, useTheme } from "@/theme";

export function SessionScreen() {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const active = useActiveSession((s) => s.active);
  const restEndsAt = useActiveSession((s) => s.restEndsAt);
  const restTotal = useActiveSession((s) => s.restTotal);
  const history = useTrainingStore((s) => s.sessions);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const restAlerted = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const restLeft = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : null;
  useEffect(() => {
    if (restEndsAt && restLeft != null && restLeft <= 0 && restAlerted.current !== restEndsAt) {
      restAlerted.current = restEndsAt;
      if (process.env.EXPO_OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => useActiveSession.getState().clearRest(), 3000);
      return () => clearTimeout(timer);
    }
  }, [restEndsAt, restLeft]);

  if (!active) {
    return (
      <EmptyState icon="strength" title={t.training.sessionNotFound} body={t.training.noRecent}>
        <Button label={t.common.back} kind="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace("/training"))} />
      </EmptyState>
    );
  }

  const stats = sessionStats(active, now);

  const finish = async () => {
    setError(null);
    if (stats.doneSets === 0) {
      setError(t.training.nothingDone);
      return;
    }
    const left = stats.totalSets - stats.doneSets;
    if (!(await confirm(t.training.finishTitle, t.training.finishBody(left), t.training.finish, t.common.cancel))) return;
    const current = useActiveSession.getState().active;
    if (!current) return;
    const saved = useTrainingStore.getState().finishSession(current, Date.now());
    if (!saved) return;
    if (saved.slotId) useAppStore.getState().setStrengthSlot(saved.slotId, { status: "completed", sessionId: saved.id });
    useActiveSession.getState().setActive(null);
    router.replace({ pathname: "/sessions/[id]", params: { id: saved.id } });
  };

  const discard = async () => {
    if (!(await confirm(t.training.discardTitle, t.training.discardBody, t.training.discard, t.common.cancel, true))) return;
    useActiveSession.getState().setActive(null);
    if (router.canGoBack()) router.back();
    else router.replace("/training");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: l(active.name) }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ ...screenContent, gap: space.l, paddingBottom: 140 }}
      >
        <View style={{ flexDirection: "row", gap: space.xl }}>
          <View>
            <Txt variant="caption" muted>
              {t.training.elapsed}
            </Txt>
            <Num size={36}>{formatDuration(stats.duration)}</Num>
          </View>
          <View>
            <Txt variant="caption" muted>
              {t.training.setsDone}
            </Txt>
            <Num size={36}>
              {stats.doneSets}/{stats.totalSets}
            </Num>
          </View>
        </View>

        {active.exercises.length === 0 ? <Txt muted>{t.training.noExercises}</Txt> : null}

        {active.exercises.map((ex, i) => (
          <ExerciseCard key={`${ex.exerciseId}-${i}`} index={i} total={active.exercises.length} exercise={ex} previous={previousSets(history, ex.exerciseId)} now={now} />
        ))}

        <Button label={t.training.addExercise} kind="secondary" icon="plus" onPress={() => router.push({ pathname: "/exercises", params: { pick: "session" } })} />
        {error ? (
          <Txt variant="caption" color={theme.track} accessibilityLiveRegion="polite">
            {error}
          </Txt>
        ) : null}
        <Button label={t.training.finish} icon="check" onPress={() => void finish()} />
        <Button label={t.training.discard} kind="danger" onPress={() => void discard()} />
      </ScrollView>

      {restEndsAt && restLeft != null ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: insets.bottom + 12,
            maxWidth: 656,
            alignSelf: "center",
            backgroundColor: theme.text,
            borderRadius: radius.section,
            borderCurve: "continuous",
            padding: 12,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.m }}>
            <View style={{ flex: 1 }}>
              <Txt variant="label" color={theme.bg}>
                {restLeft > 0 ? t.training.resting : t.training.restDone}
              </Txt>
              <Num size={30} color={theme.bg}>
                {formatDuration(Math.max(0, restLeft))}
              </Num>
            </View>
            <RestButton label="−15" onPress={() => useActiveSession.getState().adjustRest(-15)} />
            <RestButton label="+15" onPress={() => useActiveSession.getState().adjustRest(15)} />
            <RestButton label={t.training.skipRest} onPress={() => useActiveSession.getState().clearRest()} />
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.textMuted }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.track, width: `${Math.max(0, Math.min(1, restLeft / Math.max(1, restTotal))) * 100}%` }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function RestButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ minWidth: 48, minHeight: 44, paddingHorizontal: 10, borderRadius: radius.button, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? theme.textMuted : "transparent", cursor: "pointer" }) as ViewStyle}
    >
      <Txt variant="heading" color={theme.bg}>
        {label}
      </Txt>
    </Pressable>
  );
}

function IconButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) =>
        ({ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.button, backgroundColor: pressed ? theme.surfaceAlt : "transparent", opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer" }) as ViewStyle
      }
    >
      <Icon name={icon} size={18} color={theme.textMuted} />
    </Pressable>
  );
}

function ExerciseCard({ index, total, exercise, previous, now }: { index: number; total: number; exercise: SessionExercise; previous: LoggedSet[]; now: number }) {
  const t = useT();
  const l = useLocalized();
  const w = useWeight();
  const theme = useTheme();
  const info = EXERCISE_MAP[exercise.exerciseId];
  const store = useActiveSession.getState();
  if (!info) return null;
  const timed = info.measure === "time";

  const prevText = (i: number) => {
    const p = previous[i];
    if (!p) return "–";
    if (timed) return t.training.seconds(p.seconds ?? 0);
    return p.weight ? `${w.show(p.weight)}×${p.reps ?? 0}` : `${p.reps ?? 0}`;
  };

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", paddingVertical: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 4 }}>
        <Pressable
          style={{ flex: 1, minHeight: 44, justifyContent: "center", cursor: "pointer" } as ViewStyle}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: "/exercises/[id]", params: { id: info.id } })}
        >
          <Txt variant="heading" color={theme.track}>
            {l(info.name)}
          </Txt>
          <Txt variant="caption" muted>
            {[info.perSide ? t.training.perSide : null, exercise.restSeconds > 0 ? t.training.rest(exercise.restSeconds) : null].filter(Boolean).join(" · ")}
          </Txt>
        </Pressable>
        <IconButton icon="up2" label={t.training.moveUp} disabled={index === 0} onPress={() => store.moveExercise(index, -1)} />
        <IconButton icon="down2" label={t.training.moveDown} disabled={index === total - 1} onPress={() => store.moveExercise(index, 1)} />
        <IconButton icon="trash" label={t.training.removeExercise} onPress={() => store.removeExercise(index)} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Txt variant="caption" muted style={{ width: 28, textAlign: "center" }}>
          {t.training.set}
        </Txt>
        <Txt variant="caption" muted style={{ flex: 1 }}>
          {t.training.previous}
        </Txt>
        {info.weighted ? (
          <Txt variant="caption" muted style={{ width: 64, textAlign: "center" }}>
            {w.unit}
          </Txt>
        ) : null}
        <Txt variant="caption" muted style={{ width: 56, textAlign: "center" }}>
          {timed ? t.training.secondsCol : t.training.repsCol}
        </Txt>
        <View style={{ width: 44 }} />
      </View>

      {exercise.sets.map((set, i) => (
        <View
          key={i}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: set.done ? theme.fieldSoft : "transparent" }}
        >
          <Num size={20} style={{ width: 28, textAlign: "center" }}>
            {i + 1}
          </Num>
          <Txt variant="caption" muted style={{ flex: 1 }} numberOfLines={1}>
            {prevText(i)}
          </Txt>
          {info.weighted ? (
            <NumberCell
              label={`${l(info.name)} ${t.training.set} ${i + 1} ${w.unit}`}
              value={w.show(set.weight)}
              decimal
              width={64}
              onCommit={(text) => store.updateSet(index, i, { weight: w.parse(text) })}
            />
          ) : null}
          <NumberCell
            label={`${l(info.name)} ${t.training.set} ${i + 1} ${timed ? t.training.secondsCol : t.training.repsCol}`}
            value={String((timed ? set.seconds : set.reps) ?? "")}
            width={56}
            onCommit={(text) => {
              const n = text.trim() === "" ? null : Math.max(0, Math.round(Number(text)));
              const value = n != null && Number.isFinite(n) ? n : null;
              store.updateSet(index, i, timed ? { seconds: value } : { reps: value });
            }}
          />
          <Pressable
            onPress={() => store.toggleDone(index, i, now)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: set.done }}
            accessibilityLabel={set.done ? t.training.markUndone(i + 1) : t.training.markDone(i + 1)}
            style={({ pressed }) =>
              ({
                width: 44,
                height: 44,
                borderRadius: radius.button,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: set.done ? theme.field : pressed ? theme.separator : theme.surfaceAlt,
                cursor: "pointer",
              }) as ViewStyle
            }
          >
            <Icon name="check" size={20} color={set.done ? theme.onField : theme.textMuted} />
          </Pressable>
        </View>
      ))}

      <View style={{ flexDirection: "row", gap: space.s, paddingHorizontal: 12, paddingTop: 8 }}>
        <Button label={t.training.addSet} kind="plain" icon="plus" onPress={() => store.addSet(index)} style={{ flex: 1, minHeight: 44 }} />
        {exercise.sets.length > 1 ? (
          <Button
            label={t.training.removeSet(exercise.sets.length)}
            kind="plain"
            icon="minus"
            onPress={() => store.removeSet(index, exercise.sets.length - 1)}
            style={{ flex: 1, minHeight: 44 }}
          />
        ) : null}
      </View>
    </View>
  );
}

/** Keeps its own text while focused so "12." can be typed on the way to "12.5". */
function NumberCell({ value, onCommit, width, decimal, label }: { value: string; onCommit: (text: string) => void; width: number; decimal?: boolean; label: string }) {
  const theme = useTheme();
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(value);
  }, [value, focused]);
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onCommit(text);
      }}
      onSubmitEditing={() => onCommit(text)}
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
      inputMode={decimal ? "decimal" : "numeric"}
      selectTextOnFocus
      aria-label={label}
      returnKeyType="done"
      style={{
        width,
        height: 44,
        borderRadius: radius.button,
        backgroundColor: theme.surfaceAlt,
        color: theme.text,
        fontSize: 17,
        textAlign: "center",
        fontVariant: ["tabular-nums"],
        borderWidth: focused ? 2 : 0,
        borderColor: theme.track,
      }}
    />
  );
}
