import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Row, Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Txt } from "@/components/text";
import { EXERCISE_MAP } from "@/data/exercises";
import { useFormat } from "@/hooks/use-format";
import { useWeight } from "@/hooks/use-weight";
import { useLocalized, useT } from "@/i18n";
import { formatDuration } from "@/lib/format";
import { sessionStats } from "@/lib/training";
import { useAppStore } from "@/store/app-store";
import { useTrainingStore } from "@/store/training-store";
import { confirm } from "@/services/confirm";
import { screenContent, space } from "@/theme";

export function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const l = useLocalized();
  const f = useFormat();
  const w = useWeight();
  const session = useTrainingStore((s) => s.sessions.find((x) => x.id === id));
  const deleteSession = useTrainingStore((s) => s.deleteSession);

  if (!session) return <EmptyState icon="missed" title={t.common.errorTitle} body={t.training.sessionNotFound} />;

  const stats = sessionStats(session);

  const remove = async () => {
    if (!(await confirm(t.training.deleteSessionTitle, t.training.deleteSessionBody, t.common.delete, t.common.cancel, true))) return;
    if (session.slotId) useAppStore.getState().setStrengthSlot(session.slotId, { status: "planned", sessionId: undefined });
    router.back();
    deleteSession(session.id);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Stack.Screen options={{ title: l(session.name) }} />
      <Txt variant="label" muted>
        {f.dateTime(session.startedAt)}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.xl, rowGap: space.l }}>
        <Stat label={t.training.duration} value={formatDuration(stats.duration)} size={36} />
        <Stat label={t.training.setsDone} value={String(stats.doneSets)} size={36} />
        {stats.volume > 0 ? <Stat label={t.training.volume} value={w.show(stats.volume)} unit={w.unit} size={36} /> : null}
      </View>

      {session.exercises.map((ex, i) => {
        const info = EXERCISE_MAP[ex.exerciseId];
        if (!info) return null;
        return (
          <View key={`${ex.exerciseId}-${i}`} style={{ gap: space.s }}>
            <SectionTitle>{l(info.name)}</SectionTitle>
            <Section>
              {ex.sets.map((set, k) => (
                <Row
                  key={k}
                  title={`${t.training.set} ${k + 1}`}
                  value={[
                    set.weight ? `${w.show(set.weight)} ${w.unit}` : null,
                    set.reps != null ? t.training.reps(set.reps) : null,
                    set.seconds != null ? t.training.seconds(set.seconds) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ))}
            </Section>
          </View>
        );
      })}

      <Button label={t.training.deleteSession} kind="danger" icon="trash" onPress={() => void remove()} />
    </ScrollView>
  );
}
