import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { ExerciseThumb } from "@/components/exercise-thumb";
import { Icon } from "@/components/icon";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { SectionTitle } from "@/components/section";
import { Txt } from "@/components/text";
import { EXERCISE_MAP } from "@/data/exercises";
import { useLocalized, useT } from "@/i18n";
import { routineDuration } from "@/lib/training";
import { useRoutineDraft } from "@/store/routine-draft";
import { findRoutine, newTrainingId, useTrainingStore } from "@/store/training-store";
import { confirm } from "@/services/confirm";
import { radius, screenContent, space, useTheme } from "@/theme";
import { CategoryMark, useStartRoutine, useTargetText } from "./training-shared";

export function RoutineDetailScreen() {
  const { id, slot } = useLocalSearchParams<{ id: string; slot?: string }>();
  const t = useT();
  const l = useLocalized();
  const custom = useTrainingStore((s) => s.customRoutines);
  const deleteRoutine = useTrainingStore((s) => s.deleteRoutine);
  const startRoutine = useStartRoutine();
  const targetText = useTargetText();
  const theme = useTheme();
  const routine = findRoutine(id, custom);

  if (!routine) return <EmptyState icon="missed" title={t.common.errorTitle} body={t.training.sessionNotFound} />;

  const edit = (copy: boolean) => {
    const draft = copy
      ? { ...routine, id: newTrainingId("r"), builtIn: false, name: { en: `${routine.name.en} (copy)`, id: `${routine.name.id} (salinan)` } }
      : routine;
    useRoutineDraft.getState().setDraft(draft);
    router.push("/routine-edit");
  };

  const remove = async () => {
    if (!(await confirm(t.training.deleteRoutineTitle, t.training.deleteRoutineBody, t.common.delete, t.common.cancel, true))) return;
    router.back();
    deleteRoutine(routine.id);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Stack.Screen options={{ title: l(routine.name) }} />
      <View style={{ gap: space.s }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s }}>
          <CategoryMark category={routine.category} />
          <Txt variant="label" muted>
            {routine.builtIn ? t.training.category[routine.category] : `${t.training.custom} · ${t.training.category[routine.category]}`} ·{" "}
            {t.training.estimate(Math.round(routineDuration(routine, EXERCISE_MAP) / 60))}
          </Txt>
        </View>
        {routine.description ? <Txt>{l(routine.description)}</Txt> : null}
      </View>

      <Button label={t.training.startRoutine} icon="play" onPress={() => void startRoutine(routine.id, slot)} />

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.exercisesCount(routine.items.length)}</SectionTitle>
        {routine.items.map((item, i) => {
          const ex = EXERCISE_MAP[item.exerciseId];
          if (!ex) return null;
          return (
            <Pressable
              key={`${item.exerciseId}-${i}`}
              onPress={() => router.push({ pathname: "/exercises/[id]", params: { id: ex.id } })}
              accessibilityRole="button"
              style={({ pressed }) =>
                ({ flexDirection: "row", alignItems: "center", gap: space.m, padding: 16, borderRadius: radius.card, backgroundColor: pressed ? theme.surfaceAlt : theme.surface, cursor: "pointer" }) as ViewStyle
              }
            >
              <ExerciseThumb exercise={ex} />
              <View style={{ flex: 1, gap: space.s, alignItems: "flex-start" }}>
                <Txt variant="heading" style={{ fontSize: 18, lineHeight: 23 }}>
                  {l(ex.name)}
                </Txt>
                <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: theme.surfaceAlt }}>
                  <Txt variant="label">{targetText(ex, item)}</Txt>
                </View>
              </View>
              <Icon name="chevron" size={14} color={theme.primary} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: space.s }}>
        {routine.builtIn ? (
          <Button label={t.training.copyRoutine} kind="secondary" icon="copy" onPress={() => edit(true)} />
        ) : (
          <>
            <Button label={t.training.editRoutine} kind="secondary" icon="edit" onPress={() => edit(false)} />
            <Button label={t.training.deleteRoutine} kind="danger" icon="trash" onPress={() => void remove()} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
