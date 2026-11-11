import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Icon } from "@/components/icon";
import { Row, Section, SectionTitle } from "@/components/section";
import { Txt } from "@/components/text";
import { EXERCISE_MAP, EXERCISES } from "@/data/exercises";
import { BUILT_IN_ROUTINES } from "@/data/routines";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useLocalized, useT } from "@/i18n";
import { formatDuration } from "@/lib/format";
import { routineDuration, sessionStats } from "@/lib/training";
import type { ExerciseCategory, Routine } from "@/lib/training-types";
import { useAppStore } from "@/store/app-store";
import { findRoutine, useActiveSession, useTrainingStore } from "@/store/training-store";
import { useRoutineDraft } from "@/store/routine-draft";
import { screenContent, space, useTheme } from "@/theme";
import { CategoryMark, useStartRoutine } from "./training-shared";

const CATEGORIES: ExerciseCategory[] = ["strength", "core", "plyometric", "yoga", "diastasis", "mobility"];

export function TrainingScreen() {
  const t = useT();
  const l = useLocalized();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const active = useActiveSession((s) => s.active);
  const custom = useTrainingStore((s) => s.customRoutines);
  const sessions = useTrainingStore((s) => s.sessions);
  const startEmpty = useTrainingStore((s) => s.startEmpty);
  const slots = useAppStore((s) => s.plan?.strength);
  const startRoutine = useStartRoutine();
  const [filter, setFilter] = useState<ExerciseCategory | null>(null);

  const todaySlot = slots?.find((s) => s.date === today && s.status === "planned");
  const todayRoutine = findRoutine(todaySlot?.routineId, custom);
  const builtIn = filter ? BUILT_IN_ROUTINES.filter((r) => r.category === filter) : BUILT_IN_ROUTINES;
  const activeStats = active ? sessionStats(active) : null;

  const routineRow = (r: Routine) => (
    <Row
      key={r.id}
      title={l(r.name)}
      subtitle={`${t.training.category[r.category]} · ${t.training.exercisesCount(r.items.length)} · ${t.training.estimate(Math.round(routineDuration(r, EXERCISE_MAP) / 60))}`}
      leading={<CategoryMark category={r.category} />}
      onPress={() => router.push({ pathname: "/routines/[id]", params: { id: r.id } })}
    />
  );

  const newRoutine = () => {
    useRoutineDraft.getState().setDraft({ id: "", category: "strength", name: { en: "", id: "" }, items: [], builtIn: false });
    router.push("/routine-edit");
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      {active && activeStats ? (
        <Banner icon="play" tone="attention" title={t.training.resume} body={t.training.resumeHint(l(active.name), activeStats.doneSets, activeStats.totalSets)}>
          <Button label={t.training.resume} onPress={() => router.push("/session")} />
        </Banner>
      ) : null}

      {todaySlot && todayRoutine && !active ? (
        <Banner icon="today" tone="good" title={t.training.planned} body={`${l(todayRoutine.name)} · ${t.training.estimate(Math.round(routineDuration(todayRoutine, EXERCISE_MAP) / 60))}`}>
          <Button label={t.training.startRoutine} icon="play" onPress={() => void startRoutine(todayRoutine.id, todaySlot.id)} />
        </Banner>
      ) : null}

      <View style={{ gap: space.s }}>
        <Section>
          <Row
            title={t.training.library}
            subtitle={t.training.libraryHint(EXERCISES.length)}
            leading={<Icon name="book" size={20} color={theme.text} />}
            onPress={() => router.push("/exercises")}
          />
        </Section>
        {!active ? (
          <Button
            label={t.training.startEmpty}
            kind="secondary"
            icon="plus"
            onPress={() => {
              startEmpty({ en: "Workout", id: "Latihan" });
              router.push("/session");
            }}
          />
        ) : null}
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle action={<Button label={t.training.newRoutine} kind="plain" icon="plus" onPress={newRoutine} style={{ minHeight: 44, paddingHorizontal: 8 }} />}>
          {t.training.yourRoutines}
        </SectionTitle>
        {custom.length > 0 ? <Section>{custom.map(routineRow)}</Section> : <Txt muted>{t.training.noCustom}</Txt>}
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.routines}</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }}>
          <Chip label={t.training.all} selected={filter == null} onPress={() => setFilter(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={t.training.category[c]} selected={filter === c} onPress={() => setFilter(c)} />
          ))}
        </ScrollView>
        <Section>{builtIn.map(routineRow)}</Section>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.recent}</SectionTitle>
        {sessions.length === 0 ? (
          <Txt muted>{t.training.noRecent}</Txt>
        ) : (
          <Section>
            {sessions.slice(0, 5).map((s) => {
              const stats = sessionStats(s);
              return (
                <Row
                  key={s.id}
                  title={l(s.name)}
                  subtitle={`${f.dateTime(s.startedAt)} · ${formatDuration(stats.duration)} · ${stats.doneSets} ${t.training.setsDone.toLowerCase()}`}
                  onPress={() => router.push({ pathname: "/sessions/[id]", params: { id: s.id } })}
                />
              );
            })}
          </Section>
        )}
      </View>

    </ScrollView>
  );
}
