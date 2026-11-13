import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View, type ViewStyle } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { ExerciseThumb } from "@/components/exercise-thumb";
import { Icon, type IconName } from "@/components/icon";
import { RestBar } from "@/components/rest-bar";
import { Row, Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Num, Txt } from "@/components/text";
import { TopTabs } from "@/components/top-tabs";
import { EXERCISE_MAP } from "@/data/exercises";
import { useWeight } from "@/hooks/use-weight";
import { useLocalized, useT } from "@/i18n";
import { formatDuration } from "@/lib/format";
import { sessionStats } from "@/lib/training";
import type { Muscle, SessionExercise } from "@/lib/training-types";
import { useAppStore } from "@/store/app-store";
import { useActiveSession, useTrainingStore } from "@/store/training-store";
import { confirm } from "@/services/confirm";
import { fonts, radius, space, useTheme } from "@/theme";

type Tab = "exercises" | "overview" | "notes";

export const sessionColumn = { width: "100%", maxWidth: 680, alignSelf: "center", padding: 16 } as const;

export function SessionScreen() {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const active = useActiveSession((s) => s.active);
  const [tab, setTab] = useState<Tab>("exercises");
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!active) {
    return (
      <EmptyState icon="strength" title={t.training.sessionNotFound} body={t.training.noRecent}>
        <Button label={t.common.back} kind="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace("/training"))} />
      </EmptyState>
    );
  }

  const stats = sessionStats(active, now);
  const progress = stats.totalSets ? stats.doneSets / stats.totalSets : 0;

  const finish = async () => {
    setError(null);
    if (stats.doneSets === 0) return setError(t.training.nothingDone);
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
      <TopTabs
        tabs={[
          ["exercises", t.training.tabExercises],
          ["overview", t.training.tabOverview],
          ["notes", t.training.tabNotes],
        ]}
        value={tab}
        onChange={setTab}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ ...sessionColumn, gap: space.m, paddingBottom: 140 }}>
        {tab === "exercises" ? (
          <>
            <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", padding: 20, gap: space.m, alignItems: "center" }}>
              <Txt variant="title" style={{ textAlign: "center" }}>
                {l(active.name)}
              </Txt>
              <View style={{ flexDirection: "row", gap: space.xl }}>
                <View style={{ alignItems: "center" }}>
                  <Num size={30}>{formatDuration(stats.duration)}</Num>
                  <Txt variant="caption" muted>
                    {t.training.elapsed}
                  </Txt>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Num size={30}>
                    {stats.doneSets}/{stats.totalSets}
                  </Num>
                  <Txt variant="caption" muted>
                    {t.training.setsDone}
                  </Txt>
                </View>
              </View>
              <View
                style={{ alignSelf: "stretch", height: 8, borderRadius: 4, backgroundColor: theme.surfaceAlt }}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={t.training.progressLabel(stats.doneSets, stats.totalSets)}
                accessibilityValue={{ min: 0, max: stats.totalSets, now: stats.doneSets }}
              >
                <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.primary, width: `${progress * 100}%` }} />
              </View>
            </View>

            {active.exercises.length === 0 ? <Txt muted>{t.training.noExercises}</Txt> : null}
            {active.exercises.map((ex, i) => (
              <ExerciseCard key={`${ex.exerciseId}-${i}`} exercise={ex} index={i} total={active.exercises.length} />
            ))}

            <Pressable
              onPress={() => router.push({ pathname: "/exercises", params: { pick: "session" } })}
              accessibilityRole="button"
              style={({ pressed }) =>
                ({
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
              <Icon name="plus" size={20} color={theme.primary} />
              <Txt variant="heading" color={theme.primary}>
                {t.training.addExercise}
              </Txt>
            </Pressable>

            {error ? (
              <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite">
                {error}
              </Txt>
            ) : null}
            <Button label={t.training.finish} onPress={() => void finish()} style={{ marginTop: space.s }} />
            <Button label={t.training.discard} kind="danger" onPress={() => void discard()} />
          </>
        ) : tab === "overview" ? (
          <Overview />
        ) : (
          <Section style={{ padding: 4 }}>
            <TextInput
              value={active.note ?? ""}
              onChangeText={(v) => useActiveSession.getState().setNote(v)}
              placeholder={t.training.notesPlaceholder}
              placeholderTextColor={theme.textMuted}
              multiline
              aria-label={t.training.tabNotes}
              style={{ minHeight: 180, padding: 16, color: theme.text, fontFamily: fonts.regular, fontSize: 16, textAlignVertical: "top" }}
            />
          </Section>
        )}
      </ScrollView>
      <RestBar />
    </View>
  );
}

function ExerciseCard({ exercise, index, total }: { exercise: SessionExercise; index: number; total: number }) {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const [menu, setMenu] = useState(false);
  const info = EXERCISE_MAP[exercise.exerciseId];
  if (!info) return null;
  const name = l(info.name);
  const done = exercise.sets.filter((s) => s.done).length;
  const allDone = done === exercise.sets.length && done > 0;
  const first = exercise.sets[0];
  const target = info.measure === "time" ? t.training.secondsShort(first?.seconds ?? 0) : t.training.repsShort(first?.reps ?? 0);
  const pill = done > 0 ? t.training.setsDonePill(done, exercise.sets.length) : t.training.setsPill(exercise.sets.length, target);
  const store = useActiveSession.getState();

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", overflow: "hidden" }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <Pressable
          onPress={() => router.push({ pathname: "/session/[index]", params: { index: String(index) } })}
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${pill}`}
          style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", gap: space.m, padding: 16, paddingRight: 4, opacity: pressed ? 0.7 : 1, cursor: "pointer" }) as ViewStyle}
        >
          <ExerciseThumb exercise={info} />
          <View style={{ flex: 1, gap: space.s, alignItems: "flex-start" }}>
            <Txt variant="heading" style={{ fontSize: 18, lineHeight: 23 }}>
              {name}
            </Txt>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: allDone ? theme.primarySoft : theme.surfaceAlt,
              }}
            >
              {allDone ? <Icon name="tick" size={14} color={theme.primary} /> : null}
              <Txt variant="label" color={allDone ? theme.primary : theme.text}>
                {pill}
              </Txt>
            </View>
          </View>
        </Pressable>
        <Pressable
          onPress={() => setMenu((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={t.training.menu(name)}
          accessibilityState={{ expanded: menu }}
          style={({ pressed }) =>
            ({ width: 44, height: 44, margin: 12, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: pressed || menu ? theme.primarySoft : theme.bg, cursor: "pointer" }) as ViewStyle
          }
        >
          <Icon name="more" size={20} color={theme.primary} />
        </Pressable>
      </View>
      {menu ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s, paddingHorizontal: 16, paddingBottom: 16 }}>
          <MenuButton icon="book" label={t.training.openInfo} onPress={() => router.push({ pathname: "/exercises/[id]", params: { id: info.id } })} />
          <MenuButton icon="up2" label={t.training.moveUp} disabled={index === 0} onPress={() => store.moveExercise(index, -1)} />
          <MenuButton icon="down2" label={t.training.moveDown} disabled={index === total - 1} onPress={() => store.moveExercise(index, 1)} />
          <MenuButton icon="trash" label={t.training.removeExercise} danger onPress={() => store.removeExercise(index)} />
        </View>
      ) : null}
    </View>
  );
}

function MenuButton({ icon, label, onPress, disabled, danger }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  const theme = useTheme();
  const color = danger ? theme.accentText : theme.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) =>
        ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          backgroundColor: pressed ? theme.separator : danger ? theme.accentSoft : theme.primarySoft,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }) as ViewStyle
      }
    >
      <Icon name={icon} size={16} color={color} />
      <Txt variant="label" color={color}>
        {label}
      </Txt>
    </Pressable>
  );
}

function Overview() {
  const t = useT();
  const l = useLocalized();
  const w = useWeight();
  const active = useActiveSession((s) => s.active);
  if (!active) return null;
  const stats = sessionStats(active);
  const muscles = [...new Set(active.exercises.flatMap((e) => EXERCISE_MAP[e.exerciseId]?.muscles ?? []))] as Muscle[];

  return (
    <View style={{ gap: space.l }}>
      <Section style={{ padding: 20 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.xl, rowGap: space.l }}>
          <Stat label={t.training.duration} value={formatDuration(stats.duration)} />
          <Stat label={t.training.setsDone} value={`${stats.doneSets}/${stats.totalSets}`} />
          {stats.volume > 0 ? <Stat label={t.training.volume} value={w.show(stats.volume)} unit={w.unit} /> : null}
        </View>
      </Section>
      {muscles.length > 0 ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.training.musclesWorked}</SectionTitle>
          <Txt>{muscles.map((m) => t.training.muscle[m]).join(", ")}</Txt>
        </View>
      ) : null}
      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.exerciseProgress}</SectionTitle>
        <Section>
          {active.exercises.map((ex, i) => {
            const info = EXERCISE_MAP[ex.exerciseId];
            if (!info) return null;
            return (
              <Row
                key={`${ex.exerciseId}-${i}`}
                title={l(info.name)}
                value={`${ex.sets.filter((s) => s.done).length}/${ex.sets.length}`}
                onPress={() => router.push({ pathname: "/session/[index]", params: { index: String(i) } })}
              />
            );
          })}
        </Section>
      </View>
    </View>
  );
}
