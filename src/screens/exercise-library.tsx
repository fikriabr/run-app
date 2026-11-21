import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, TextInput, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Row } from "@/components/section";
import { EXERCISES } from "@/data/exercises";
import { DR_AVOID } from "@/data/exercises-more";
import { useLocalized, useT } from "@/i18n";
import type { Equipment, ExerciseCategory } from "@/lib/training-types";
import { useActiveSession } from "@/store/training-store";
import { useRoutineDraft } from "@/store/routine-draft";
import { radius, screenContent, space, useTheme, fonts } from "@/theme";
import { ExerciseThumb } from "@/components/exercise-thumb";
import { AvoidList } from "./exercise-sections";

const CATEGORIES: ExerciseCategory[] = ["strength", "core", "plyometric", "yoga", "diastasis", "mobility"];
const EQUIPMENT_FILTERS: Equipment[] = ["none", "dumbbell", "barbell", "kettlebell", "band", "pullupBar", "bench", "box"];

/** Browses the library; with `pick` set it adds the tapped exercise to the workout or routine draft instead. */
export function ExerciseLibraryScreen() {
  const { pick } = useLocalSearchParams<{ pick?: "session" | "builder" }>();
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [showAvoid, setShowAvoid] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter(
      (e) =>
        (!category || e.category === category) &&
        (!equipment || e.equipment.includes(equipment)) &&
        (!q || e.name.en.toLowerCase().includes(q) || e.name.id.toLowerCase().includes(q)),
    );
  }, [query, category, equipment]);

  const choose = (exerciseId: string) => {
    if (pick === "session") {
      useActiveSession.getState().addExercise(exerciseId);
      router.back();
    } else if (pick === "builder") {
      const { draft, setDraft } = useRoutineDraft.getState();
      if (draft) {
        const timed = EXERCISES.find((e) => e.id === exerciseId)?.measure === "time";
        setDraft({ ...draft, items: [...draft.items, { exerciseId, sets: 3, target: timed ? 30 : 10, restSeconds: 60 }] });
      }
      router.back();
    } else {
      router.push({ pathname: "/exercises/[id]", params: { id: exerciseId } });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: pick ? t.training.pickTitle : t.training.library }} />
      <FlatList
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={screenContent}
      data={results}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={
        <View style={{ gap: space.m, paddingBottom: space.l }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.training.search}
            placeholderTextColor={theme.textMuted}
            aria-label={t.training.search}
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: radius.button, backgroundColor: theme.surface, color: theme.text, fontFamily: fonts.medium, fontSize: 16 }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }} keyboardShouldPersistTaps="handled">
            <Chip label={t.training.all} selected={category == null} onPress={() => setCategory(null)} />
            {CATEGORIES.map((c) => (
              <Chip key={c} label={t.training.category[c]} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }} keyboardShouldPersistTaps="handled">
            <Chip label={t.training.anyEquipment} selected={equipment == null} onPress={() => setEquipment(null)} />
            {EQUIPMENT_FILTERS.map((e) => (
              <Chip key={e} label={t.training.equipment[e]} selected={equipment === e} onPress={() => setEquipment(e)} />
            ))}
          </ScrollView>
          {category === "diastasis" ? (
            showAvoid ? (
              <AvoidList avoid={DR_AVOID} />
            ) : (
              <Button label={t.training.avoidTitle} kind="secondary" icon="skipped" onPress={() => setShowAvoid(true)} />
            )
          ) : null}
        </View>
      }
      ListEmptyComponent={<EmptyState icon="search" title={t.training.noResults} body="" />}
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === results.length - 1;
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
              title={l(item.name)}
              subtitle={`${t.training.category[item.category]} · ${item.muscles.slice(0, 3).map((m) => t.training.muscle[m]).join(", ")}`}
              leading={<ExerciseThumb exercise={item} size={52} />}
              onPress={() => choose(item.id)}
            />
          </View>
        );
      }}
      />
    </>
  );
}
