import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Chip } from "@/components/chip";
import { Row } from "@/components/section";
import { RECIPES } from "@/data/recipes";
import { useLocalized, useT } from "@/i18n";
import { recipesFor } from "@/lib/nutrition";
import type { Cuisine, MealSlot } from "@/lib/nutrition-types";
import { useNutritionStore } from "@/store/nutrition-store";
import { radius, screenContent, space, useTheme } from "@/theme";

const CUISINES: Cuisine[] = ["indonesian", "western", "chinese", "japanese", "korean", "indian", "mediterranean"];
const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

/** Every recipe the diet allows, filtered by region and meal. */
export function RecipesScreen() {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const diet = useNutritionStore((s) => s.prefs.diet);
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [slot, setSlot] = useState<MealSlot | null>(null);
  const list = useMemo(() => recipesFor(RECIPES, slot, cuisine ? [cuisine] : [], diet).filter((r) => !cuisine || r.cuisine === cuisine), [cuisine, slot, diet]);

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={screenContent}
      data={list}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        <View style={{ gap: space.m, paddingBottom: space.l }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }}>
            <Chip label={t.nutrition.all} selected={cuisine == null} onPress={() => setCuisine(null)} />
            {CUISINES.map((c) => (
              <Chip key={c} label={t.nutrition.cuisine[c]} selected={cuisine === c} onPress={() => setCuisine(c)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }}>
            <Chip label={t.nutrition.allMeals} selected={slot == null} onPress={() => setSlot(null)} />
            {SLOTS.map((s) => (
              <Chip key={s} label={t.nutrition.slot[s]} selected={slot === s} onPress={() => setSlot(s)} />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={<EmptyState icon="search" title={t.training.noResults} body="" />}
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === list.length - 1;
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
              subtitle={`${t.nutrition.cuisine[item.cuisine]} · ${t.nutrition.minutes(item.minutes)} · ${item.kcal} ${t.nutrition.kcal} · ${item.protein} g ${t.nutrition.protein.toLowerCase()}`}
              onPress={() => router.push({ pathname: "/recipes/[id]", params: { id: item.id } })}
            />
          </View>
        );
      }}
    />
  );
}
