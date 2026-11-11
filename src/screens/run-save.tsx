import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useT } from "@/i18n";
import { matchWorkout } from "@/lib/adapt";
import { formatDuration } from "@/lib/format";
import { averagePace, toActivity } from "@/lib/run-engine";
import { newId, useAppStore } from "@/store/app-store";
import { useRunStore } from "@/store/run-store";
import { confirm } from "@/services/confirm";
import { radius, space, useTheme, screenContent } from "@/theme";

export function RunSaveScreen() {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const run = useRunStore((s) => s.run);
  const workoutId = useRunStore((s) => s.workoutId);
  const plan = useAppStore((s) => s.plan);
  const saveActivity = useAppStore((s) => s.saveActivity);
  const [rpe, setRpe] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const planned = workoutId ? plan?.workouts.find((w) => w.id === workoutId) : undefined;
  const candidate = planned ?? matchWorkout(plan, today);
  const [linkCandidate, setLinkCandidate] = useState(true);

  if (!run || run.status !== "finished") {
    return (
      <EmptyState icon="missed" title={t.common.errorTitle} body={t.activity.notFound}>
        <Button label={t.run.close} kind="secondary" onPress={() => router.back()} />
      </EmptyState>
    );
  }

  const linked = candidate && (planned || linkCandidate) ? candidate : undefined;

  const save = () => {
    const id = newId("a");
    const activity = toActivity(run, id, { workoutId: linked?.id, workoutType: linked?.type });
    saveActivity(activity, run.points, rpe, note);
    useRunStore.getState().clear();
    router.replace({ pathname: "/runs/[id]", params: { id } });
  };

  const discard = async () => {
    if (!(await confirm(t.save.discardTitle, t.save.discardBody, t.save.discard, t.common.cancel, true))) return;
    useRunStore.getState().clear();
    // A run opened from a deep link has nothing to go back to.
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ ...screenContent, gap: space.xl }}
    >
      <View style={{ flexDirection: "row", gap: space.l, flexWrap: "wrap" }}>
        <Stat label={t.run.distance} value={f.distance(run.distance)} unit={f.unit} size={40} />
        <Stat label={t.run.time} value={formatDuration(run.bankedMs / 1000)} size={40} />
        <Stat label={t.run.avgPace} value={f.pace(averagePace(run.distance, run.bankedMs))} unit={f.perUnit} size={40} />
      </View>

      {candidate ? (
        planned ? (
          <Txt variant="label" muted>
            {t.save.linked(t.workout[planned.type])}
          </Txt>
        ) : (
          <Chip role="checkbox" label={t.save.linked(t.workout[candidate.type])} selected={linkCandidate} onPress={() => setLinkCandidate((v) => !v)} grow />
        )
      ) : null}

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.save.effort}</SectionTitle>
        <Txt variant="caption" muted>
          {t.save.effortHint}
        </Txt>
        <ChipRow>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <Chip key={n} label={String(n)} selected={rpe === n} onPress={() => setRpe(rpe === n ? null : n)} />
          ))}
        </ChipRow>
        <Txt variant="heading" accessibilityLiveRegion="polite" color={rpe != null && rpe >= 7 ? theme.track : theme.field}>
          {rpe != null ? t.save.rpe[rpe] : " "}
        </Txt>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.save.note}</SectionTitle>
        <Section>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t.save.notePlaceholder}
            placeholderTextColor={theme.textMuted}
            multiline
            aria-label={t.save.note}
            style={{ minHeight: 96, padding: 16, color: theme.text, fontSize: 16, textAlignVertical: "top", borderRadius: radius.section }}
          />
        </Section>
      </View>

      <View style={{ gap: space.s }}>
        <Button label={t.save.save} onPress={save} />
        <Button label={t.save.discard} kind="danger" onPress={() => void discard()} />
      </View>
    </ScrollView>
  );
}
