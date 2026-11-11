import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { TopTabs } from "@/components/top-tabs";
import { EXERCISE_MAP } from "@/data/exercises";
import { useLocalized, useT } from "@/i18n";
import { space, useTheme } from "@/theme";
import { ExerciseHero, ExerciseHistoryView, ExerciseHowTo, VideoOptions } from "./exercise-sections";

type Tab = "howto" | "history" | "video";

export function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("howto");
  const exercise = id ? EXERCISE_MAP[id] : undefined;

  if (!exercise) return <EmptyState icon="missed" title={t.common.errorTitle} body={t.training.noResults} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: l(exercise.name) }} />
      <TopTabs
        tabs={[
          ["howto", t.training.tabHowTo],
          ["history", t.training.tabHistory],
          ["video", t.training.video],
        ]}
        value={tab}
        onChange={setTab}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
        <ExerciseHero
          exercise={exercise}
          subtitle={`${t.training.category[exercise.category]} · ${exercise.equipment.map((e) => t.training.equipment[e]).join(", ")}`}
        />
        <View style={{ padding: 16, paddingTop: space.l, width: "100%", maxWidth: 680, alignSelf: "center" }}>
          {tab === "howto" ? <ExerciseHowTo exercise={exercise} /> : tab === "history" ? <ExerciseHistoryView exercise={exercise} /> : <VideoOptions exercise={exercise} />}
        </View>
      </ScrollView>
    </View>
  );
}
