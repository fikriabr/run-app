import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { Section, SectionTitle } from "@/components/section";
import { Stepper } from "@/components/stepper";
import { Num, Txt } from "@/components/text";
import { useToday } from "@/hooks/use-today";
import { useT } from "@/i18n";
import { dailyTargets, latestWeight, weeksToTarget } from "@/lib/nutrition";
import type { ActivityLevel, BodyProfile, Cuisine, DietFlag, DietGoal, Sex } from "@/lib/nutrition-types";
import { useNutritionStore } from "@/store/nutrition-store";
import { fonts, radius, screenContent, space, useTheme } from "@/theme";
import { parseKg } from "./nutrition";

const CUISINES: Cuisine[] = ["indonesian", "western", "chinese", "japanese", "korean", "indian", "mediterranean"];
const DIETS: DietFlag[] = ["vegetarian", "noPork", "noBeef", "noSeafood", "noDairy"];
const ACTIVITIES: ActivityLevel[] = ["low", "light", "moderate", "high"];
const GOALS: DietGoal[] = ["lose", "maintain", "gain"];

/** Body data, goal and menu choices. `onDone` runs after saving; without it the screen closes. */
export function NutritionSetup({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const theme = useTheme();
  const today = useToday();
  const saved = useNutritionStore((s) => s.profile);
  const savedPrefs = useNutritionStore((s) => s.prefs);
  const savedWeight = useNutritionStore((s) => latestWeight(s.weights));
  const setup = useNutritionStore((s) => s.setup);

  const [sex, setSex] = useState<Sex>(saved?.sex ?? "male");
  const [age, setAge] = useState(saved?.age ?? 30);
  const [height, setHeight] = useState(saved?.heightCm ?? 168);
  const [weightText, setWeightText] = useState(savedWeight ? String(savedWeight.kg) : "");
  const [goal, setGoal] = useState<DietGoal>(saved?.goal ?? "lose");
  const [targetText, setTargetText] = useState(saved?.targetKg != null ? String(saved.targetKg) : "");
  const [activity, setActivity] = useState<ActivityLevel>(saved?.activity ?? "light");
  const [cuisines, setCuisines] = useState<Cuisine[]>(savedPrefs.cuisines);
  const [diet, setDiet] = useState<DietFlag[]>(savedPrefs.diet);
  const [meals, setMeals] = useState<3 | 4>(savedPrefs.mealsPerDay);
  const [tried, setTried] = useState(false);

  const kg = parseKg(weightText);
  const targetKg = parseKg(targetText) ?? undefined;
  const profile: BodyProfile = { sex, age, heightCm: height, activity, goal, targetKg: goal === "maintain" ? undefined : targetKg };
  const targets = kg != null ? dailyTargets(profile, kg) : null;
  const weeks = kg != null ? weeksToTarget(kg, profile.targetKg, goal) : null;

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const save = () => {
    setTried(true);
    if (kg == null || cuisines.length === 0) return;
    setup(profile, { cuisines, diet, mealsPerDay: meals }, { date: today, kg });
    if (onDone) onDone();
    else router.back();
  };

  const numberInput = (value: string, onChange: (v: string) => void, label: string) => (
    <Section>
      <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 16 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="70"
          placeholderTextColor={theme.textMuted}
          aria-label={label}
          style={{ flex: 1, minHeight: 56, paddingHorizontal: 16, color: theme.text, fontFamily: fonts.bold, fontSize: 22, borderRadius: radius.section }}
        />
        <Txt muted>kg</Txt>
      </View>
    </Section>
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.aboutYou}</SectionTitle>
        <ChipRow>
          {(["male", "female"] as const).map((s) => (
            <Chip key={s} label={t.nutrition[s]} selected={sex === s} onPress={() => setSex(s)} />
          ))}
        </ChipRow>
        <Stepper label={t.nutrition.age} value={age} min={16} max={90} format={t.nutrition.years} onChange={setAge} />
        <Stepper label={t.nutrition.height} value={height} min={130} max={210} format={(v) => `${v} cm`} onChange={setHeight} />
        <Txt variant="label" muted>
          {t.nutrition.weightNow}
        </Txt>
        {numberInput(weightText, setWeightText, t.nutrition.weightNow)}
        {tried && kg == null ? (
          <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite">
            {t.nutrition.weightInvalid}
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.goalTitle}</SectionTitle>
        <ChipRow>
          {GOALS.map((g) => (
            <Chip key={g} label={t.nutrition.goal[g]} selected={goal === g} onPress={() => setGoal(g)} />
          ))}
        </ChipRow>
        {goal !== "maintain" ? (
          <>
            <Txt variant="label" muted>
              {t.nutrition.targetWeight}
            </Txt>
            {numberInput(targetText, setTargetText, t.nutrition.targetWeight)}
          </>
        ) : null}
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.activityTitle}</SectionTitle>
        <View style={{ gap: space.s }}>
          {ACTIVITIES.map((a) => (
            <Chip key={a} label={t.nutrition.activity[a]} selected={activity === a} onPress={() => setActivity(a)} grow />
          ))}
        </View>
        <Txt variant="caption" muted>
          {t.nutrition.activityHint}
        </Txt>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.cuisinesTitle}</SectionTitle>
        <Txt variant="caption" muted>
          {t.nutrition.cuisinesHint}
        </Txt>
        <ChipRow>
          {CUISINES.map((c) => (
            <Chip key={c} role="checkbox" label={t.nutrition.cuisine[c]} selected={cuisines.includes(c)} onPress={() => setCuisines((x) => toggle(x, c))} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.dietTitle}</SectionTitle>
        <ChipRow>
          {DIETS.map((d) => (
            <Chip key={d} role="checkbox" label={t.nutrition.diet[d]} selected={diet.includes(d)} onPress={() => setDiet((x) => toggle(x, d))} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.nutrition.mealsTitle}</SectionTitle>
        <ChipRow>
          <Chip label={t.nutrition.meals3} selected={meals === 3} onPress={() => setMeals(3)} />
          <Chip label={t.nutrition.meals4} selected={meals === 4} onPress={() => setMeals(4)} />
        </ChipRow>
      </View>

      {targets ? (
        <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 20, gap: space.m }}>
          <Txt variant="label" muted>
            {t.nutrition.preview}
          </Txt>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s, flexWrap: "wrap" }}>
            <Num size={40} selectable>
              {targets.kcal}
            </Num>
            <Txt muted>{t.nutrition.kcal}</Txt>
          </View>
          <View style={{ flexDirection: "row", gap: space.xl, flexWrap: "wrap" }}>
            {(
              [
                [t.nutrition.protein, targets.protein],
                [t.nutrition.carbs, targets.carbs],
                [t.nutrition.fat, targets.fat],
              ] as const
            ).map(([label, value]) => (
              <View key={label} style={{ gap: 2 }}>
                <Txt variant="caption" muted>
                  {label}
                </Txt>
                <Txt variant="heading" selectable>
                  {t.nutrition.grams(value)}
                </Txt>
              </View>
            ))}
          </View>
          {weeks != null ? (
            <Txt variant="caption" muted>
              {weeks === 0 ? t.nutrition.reached : t.nutrition.weeks(weeks)}
            </Txt>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: space.s }}>
        <Txt variant="caption" muted>
          {t.nutrition.disclaimer}
        </Txt>
        <Button label={t.nutrition.save} onPress={save} disabled={cuisines.length === 0} />
      </View>
    </ScrollView>
  );
}
