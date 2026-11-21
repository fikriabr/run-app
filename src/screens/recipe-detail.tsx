import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { EmptyState } from "@/components/banner";
import { Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Num, Txt } from "@/components/text";
import { RECIPE_MAP } from "@/data/recipes";
import { useLocalized, useT } from "@/i18n";
import { formatServings } from "@/lib/nutrition";
import { screenContent, space, useTheme } from "@/theme";

export function RecipeDetailScreen() {
  const { id, servings } = useLocalSearchParams<{ id: string; servings?: string }>();
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const recipe = RECIPE_MAP[id ?? ""];
  if (!recipe) return <EmptyState icon="missed" title={t.common.errorTitle} body="" />;
  const lang = l({ en: "en", id: "id" }) as "en" | "id";
  const portion = servings ? Number(servings) : 1;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ gap: space.s }}>
        <Txt variant="label" color={theme.accentText}>
          {t.nutrition.cuisine[recipe.cuisine]} · {recipe.slots.map((s) => t.nutrition.slot[s]).join(", ")} · {t.nutrition.minutes(recipe.minutes)}
        </Txt>
        <Txt variant="title" accessibilityRole="header">
          {l(recipe.name)}
        </Txt>
      </View>

      <View style={{ gap: space.m }}>
        <Txt variant="label" muted>
          {t.nutrition.perServing}
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s }}>
          <Num size={40} selectable>
            {recipe.kcal}
          </Num>
          <Txt muted>{t.nutrition.kcal}</Txt>
        </View>
        <View style={{ flexDirection: "row", gap: space.xl, flexWrap: "wrap" }}>
          <Stat label={t.nutrition.protein} value={t.nutrition.grams(recipe.protein)} color={theme.accentText} />
          <Stat label={t.nutrition.carbs} value={t.nutrition.grams(recipe.carbs)} />
          <Stat label={t.nutrition.fat} value={t.nutrition.grams(recipe.fat)} />
        </View>
        {portion !== 1 ? (
          <Txt variant="caption" muted>
            {t.nutrition.scaled(formatServings(portion))}
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.ingredients}</SectionTitle>
        <Section style={{ padding: 16, gap: space.s }}>
          {recipe.ingredients[lang].map((item) => (
            <View key={item} style={{ flexDirection: "row", gap: space.s }}>
              <Txt muted>•</Txt>
              <Txt style={{ flex: 1 }}>{item}</Txt>
            </View>
          ))}
        </Section>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.steps}</SectionTitle>
        <Section style={{ padding: 16, gap: space.m }}>
          {recipe.steps[lang].map((step, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.m }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Num size={14} color={theme.primary}>
                  {i + 1}
                </Num>
              </View>
              <Txt style={{ flex: 1 }}>{step}</Txt>
            </View>
          ))}
        </Section>
      </View>
      <Txt variant="caption" muted>
        {t.nutrition.estimate}
      </Txt>
    </ScrollView>
  );
}
