import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View, type ViewStyle } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Icon } from "@/components/icon";
import { Row, Section, SectionTitle } from "@/components/section";
import { Num, Txt } from "@/components/text";
import { WeightChart } from "@/components/weight-chart";
import { useDayMenu } from "@/hooks/use-day-menu";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useLocalized, useT } from "@/i18n";
import { addDays } from "@/lib/dates";
import { formatServings, weightChange } from "@/lib/nutrition";
import type { PlannedMeal } from "@/lib/nutrition";
import { useNutritionStore } from "@/store/nutrition-store";
import { fonts, radius, screenContent, space, useTheme } from "@/theme";

/** Parses "72.5" or "72,5" kilograms; null outside a sane range. */
export function parseKg(text: string): number | null {
  const kg = Number(text.trim().replace(",", "."));
  return Number.isFinite(kg) && kg >= 30 && kg <= 250 ? Math.round(kg * 10) / 10 : null;
}

export function NutritionScreen() {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const profile = useNutritionStore((s) => s.profile);
  const [date, setDate] = useState(today);

  if (!profile) {
    return (
      <EmptyState icon="food" title={t.nutrition.emptyTitle} body={t.nutrition.emptyBody}>
        <Button label={t.nutrition.start} onPress={() => router.push("/nutrition-setup")} />
      </EmptyState>
    );
  }

  const days = [0, 1, 2, 3, 4, 5, 6].map((d) => addDays(today, d));
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }}>
        {days.map((d) => (
          <Chip key={d} label={d === today ? t.today.hello : f.day(d)} selected={d === date} onPress={() => setDate(d)} />
        ))}
      </ScrollView>
      <DayMenu date={date} />
      <WeightSection />
      <Section>
        <Row title={t.nutrition.browse} leading={<Icon name="book" size={20} color={theme.text} />} onPress={() => router.push("/recipes")} />
        <Row title={t.nutrition.editDiet} leading={<Icon name="settings" size={20} color={theme.text} />} onPress={() => router.push("/nutrition-setup")} />
      </Section>
      <Txt variant="caption" muted>
        {t.nutrition.estimate} {t.nutrition.disclaimer}
      </Txt>
    </ScrollView>
  );
}

function Progress({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const theme = useTheme();
  const t = useT();
  const share = Math.min(1, target > 0 ? value / target : 0);
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${label}: ${t.nutrition.ofTarget(`${value} ${unit}`, `${target} ${unit}`)}`}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Txt variant="label" muted>
          {label}
        </Txt>
        <Txt style={{ fontVariant: ["tabular-nums"] }}>
          <Txt style={{ fontFamily: fonts.bold }}>{value}</Txt> / {target} {unit}
        </Txt>
      </View>
      <View style={{ height: 10, borderRadius: radius.lane, backgroundColor: theme.surfaceAlt, overflow: "hidden" }}>
        <View style={{ width: `${share * 100}%`, height: 10, borderRadius: radius.lane, backgroundColor: share >= 1 ? theme.accent : theme.primary }} />
      </View>
    </View>
  );
}

/** Targets, progress from ticked meals, the menu and protein add-ons for one date. */
export function DayMenu({ date, compact }: { date: string; compact?: boolean }) {
  const t = useT();
  const theme = useTheme();
  const today = useToday();
  const data = useDayMenu(date);
  const eaten = useNutritionStore((s) => s.eaten[date]);
  if (!data) return null;
  const { targets, menu, boosts } = data;
  const ticked = menu.meals.filter((m) => eaten?.[m.slot]);
  const eatenKcal = ticked.reduce((s, m) => s + m.kcal, 0);
  const eatenProtein = ticked.reduce((s, m) => s + m.protein, 0);
  const canTick = date <= today;

  return (
    <View style={{ gap: space.l }}>
      <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", padding: 20, gap: space.m }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s, flexWrap: "wrap" }}>
          <Num size={40} selectable>
            {targets.kcal}
          </Num>
          <Txt muted>{t.nutrition.kcal}</Txt>
          <Txt muted>·</Txt>
          <Num size={28} selectable color={theme.accentText}>
            {targets.protein}
          </Num>
          <Txt muted>
            g {t.nutrition.protein.toLowerCase()}
          </Txt>
        </View>
        {targets.runKcal > 0 ? (
          <Txt variant="caption" muted>
            {t.nutrition.runExtra(targets.runKcal)}
          </Txt>
        ) : null}
        {canTick ? (
          <>
            <Progress label={t.nutrition.protein} value={eatenProtein} target={targets.protein} unit="g" />
            <Progress label={t.nutrition.kcal} value={eatenKcal} target={targets.kcal} unit={t.nutrition.kcal} />
          </>
        ) : (
          <Txt variant="caption" muted>
            {t.nutrition.planned}: {menu.kcal} {t.nutrition.kcal} · {menu.protein} g {t.nutrition.protein.toLowerCase()}
          </Txt>
        )}
      </View>

      <View style={{ gap: space.s }}>
        {menu.meals.map((m) => (
          <MealCard key={m.slot} date={date} meal={m} eaten={!!eaten?.[m.slot]} canTick={canTick} compact={compact} />
        ))}
      </View>

      {boosts.length > 0 && !compact ? (
        <View style={{ gap: space.s }}>
          <SectionTitle>{t.nutrition.boostTitle}</SectionTitle>
          <Txt variant="caption" muted>
            {t.nutrition.boostHint(targets.protein - menu.protein)}
          </Txt>
          <Section>
            {boosts.map((b) => (
              <BoostRow key={b.id} name={b.name} protein={b.protein} kcal={b.kcal} />
            ))}
          </Section>
        </View>
      ) : null}
    </View>
  );
}

function BoostRow({ name, protein, kcal }: { name: { en: string; id: string }; protein: number; kcal: number }) {
  const l = useLocalized();
  const t = useT();
  return <Row title={l(name)} value={`+${protein} g · ${kcal} ${t.nutrition.kcal}`} />;
}

function MealCard({ date, meal, eaten, canTick, compact }: { date: string; meal: PlannedMeal; eaten: boolean; canTick: boolean; compact?: boolean }) {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const toggle = useNutritionStore((s) => s.toggleEaten);
  const swap = useNutritionStore((s) => s.swap);
  const name = l(meal.recipe.name);
  const open = () => router.push({ pathname: "/recipes/[id]", params: { id: meal.recipe.id, servings: String(meal.servings) } });

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 16, gap: space.m, opacity: eaten ? 0.7 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.m }}>
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={`${t.nutrition.slot[meal.slot]}: ${name}`}
          style={({ pressed }) => ({ flex: 1, gap: 4, opacity: pressed ? 0.7 : 1, cursor: "pointer" }) as ViewStyle}
        >
          <Txt variant="label" color={theme.accentText}>
            {t.nutrition.slot[meal.slot]} · {t.nutrition.cuisine[meal.recipe.cuisine]} · {t.nutrition.minutes(meal.recipe.minutes)}
          </Txt>
          <Txt variant="heading">{name}</Txt>
          <Txt variant="caption" muted>
            {t.nutrition.servings(formatServings(meal.servings))} · {meal.kcal} {t.nutrition.kcal} · {meal.protein} g {t.nutrition.protein.toLowerCase()}
          </Txt>
        </Pressable>
        {canTick ? (
          <Pressable
            onPress={() => toggle(date, meal.slot)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: eaten }}
            accessibilityLabel={t.nutrition.markEaten(name)}
            hitSlop={8}
            style={({ pressed }) =>
              ({
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: eaten ? theme.primary : pressed ? theme.surfaceAlt : "transparent",
                cursor: "pointer",
              }) as ViewStyle
            }
          >
            <Icon name={eaten ? "tick" : "circle"} size={eaten ? 22 : 28} color={eaten ? theme.onPrimary : theme.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {compact ? null : (
        <View style={{ flexDirection: "row", gap: space.s }}>
          <Button label={t.nutrition.swap} kind="secondary" icon="swap" onPress={() => swap(date, meal.slot)} accessibilityLabel={t.nutrition.swapLabel(t.nutrition.slot[meal.slot])} style={{ minHeight: 44, flexGrow: 1 }} />
          <Button label={t.nutrition.steps} kind="plain" icon="book" onPress={open} style={{ minHeight: 44, flexGrow: 1 }} />
        </View>
      )}
    </View>
  );
}

function WeightSection() {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const today = useToday();
  const weights = useNutritionStore((s) => s.weights);
  const profile = useNutritionStore((s) => s.profile);
  const logWeight = useNutritionStore((s) => s.logWeight);
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const last = weights[weights.length - 1];
  const recent = weights.filter((w) => w.date >= addDays(today, -90));
  const change = weightChange(weights, today, 30);
  const kg = parseKg(text);

  const save = () => {
    setTried(true);
    if (kg == null) return;
    logWeight({ date: today, kg });
    setText("");
    setTried(false);
  };

  return (
    <View style={{ gap: space.m }}>
      <SectionTitle>{t.nutrition.weightTitle}</SectionTitle>
      <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 16, gap: space.m }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s, flexWrap: "wrap" }}>
          {last ? (
            <>
              <Num size={36} selectable>
                {last.kg.toFixed(1)}
              </Num>
              <Txt muted>kg</Txt>
            </>
          ) : null}
          {change != null ? (
            <Txt muted>
              · {t.nutrition.change(`${change > 0 ? "+" : ""}${change.toFixed(1)}`, 30)}
            </Txt>
          ) : null}
          {profile?.targetKg != null && profile.goal !== "maintain" ? <Txt muted>· {t.nutrition.target(profile.targetKg.toFixed(1))}</Txt> : null}
        </View>
        {recent.length >= 2 ? (
          <WeightChart
            entries={recent}
            targetKg={profile?.goal !== "maintain" ? profile?.targetKg : undefined}
            label={t.nutrition.weightChart(recent[0].kg.toFixed(1), recent[recent.length - 1].kg.toFixed(1))}
            dayLabel={f.day}
          />
        ) : (
          <Txt variant="caption" muted>
            {t.nutrition.noWeights}
          </Txt>
        )}
        <View style={{ flexDirection: "row", gap: space.s, alignItems: "center" }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: theme.surfaceAlt, borderRadius: radius.button, paddingRight: 14 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={last ? last.kg.toFixed(1) : "70"}
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              aria-label={t.nutrition.logWeight}
              onSubmitEditing={save}
              style={{ flex: 1, minHeight: 48, paddingHorizontal: 14, color: theme.text, fontFamily: fonts.bold, fontSize: 18 }}
            />
            <Txt muted>kg</Txt>
          </View>
          <Button label={t.nutrition.logWeight} icon="scale" onPress={save} style={{ minHeight: 48 }} />
        </View>
        {tried && kg == null ? (
          <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite">
            {t.nutrition.weightInvalid}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

/** Compact food summary for the Today tab: progress and the day's meals with their ticks. */
export function TodayFoodCard({ date }: { date: string }) {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const data = useDayMenu(date);
  const eaten = useNutritionStore((s) => s.eaten[date]);
  const toggle = useNutritionStore((s) => s.toggleEaten);
  if (!data) return null;
  const { targets, menu } = data;
  const ticked = menu.meals.filter((m) => eaten?.[m.slot]);

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radius.card, borderCurve: "continuous", padding: 20, gap: space.m }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name="food" size={16} color={theme.accentText} />
        </View>
        <Txt variant="title" style={{ flex: 1 }}>
          {t.nutrition.todayCard}
        </Txt>
      </View>
      <Progress label={t.nutrition.protein} value={ticked.reduce((s, m) => s + m.protein, 0)} target={targets.protein} unit="g" />
      <Progress label={t.nutrition.kcal} value={ticked.reduce((s, m) => s + m.kcal, 0)} target={targets.kcal} unit={t.nutrition.kcal} />
      <View>
        {menu.meals.map((m) => {
          const done = !!eaten?.[m.slot];
          const name = l(m.recipe.name);
          return (
            <Pressable
              key={m.slot}
              onPress={() => toggle(date, m.slot)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={t.nutrition.markEaten(name)}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.m, minHeight: 48, opacity: pressed ? 0.7 : 1, cursor: "pointer" }) as ViewStyle}
            >
              <Icon name={done ? "check" : "circle"} size={22} color={done ? theme.primary : theme.textMuted} />
              <View style={{ flex: 1 }}>
                <Txt variant="caption" muted>
                  {t.nutrition.slot[m.slot]}
                </Txt>
                <Txt numberOfLines={1} style={{ textDecorationLine: done ? "line-through" : "none" }}>
                  {name}
                </Txt>
              </View>
              <Txt variant="caption" muted style={{ fontVariant: ["tabular-nums"] }}>
                {m.protein} g
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Button label={t.nutrition.viewMenu} kind="secondary" onPress={() => router.push("/food")} />
    </View>
  );
}
