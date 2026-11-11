import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View, type ViewStyle } from "react-native";
import { EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Chip, ChipRow } from "@/components/chip";
import { Icon, type IconName } from "@/components/icon";
import { Section, SectionTitle } from "@/components/section";
import { Txt } from "@/components/text";
import { EXERCISE_MAP } from "@/data/exercises";
import { useLocalized, useT } from "@/i18n";
import type { ExerciseCategory, RoutineItem } from "@/lib/training-types";
import { useRoutineDraft } from "@/store/routine-draft";
import { newTrainingId, useTrainingStore } from "@/store/training-store";
import { radius, screenContent, space, useTheme } from "@/theme";

const CATEGORIES: ExerciseCategory[] = ["strength", "core", "plyometric", "yoga", "diastasis", "mobility"];

export function RoutineEditScreen() {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const draft = useRoutineDraft((s) => s.draft);
  const setDraft = useRoutineDraft((s) => s.setDraft);
  const saveRoutine = useTrainingStore((s) => s.saveRoutine);
  const [error, setError] = useState<string | null>(null);

  if (!draft) return <EmptyState icon="missed" title={t.common.errorTitle} body={t.training.sessionNotFound} />;

  const nameText = l(draft.name);
  const setName = (text: string) => setDraft({ ...draft, name: { en: text, id: text } });
  const updateItem = (i: number, patch: Partial<RoutineItem>) =>
    setDraft({ ...draft, items: draft.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= draft.items.length) return;
    const items = [...draft.items];
    [items[i], items[to]] = [items[to], items[i]];
    setDraft({ ...draft, items });
  };

  const save = () => {
    if (!nameText.trim()) return setError(t.training.nameRequired);
    if (draft.items.length === 0) return setError(t.training.exercisesRequired);
    const id = draft.id || newTrainingId("r");
    saveRoutine({ ...draft, id, builtIn: false, name: { en: draft.name.en.trim(), id: draft.name.id.trim() } });
    setDraft(null);
    router.dismissTo({ pathname: "/routines/[id]", params: { id } });
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <View style={{ gap: space.s }}>
        <Txt variant="label" nativeID="routine-name">
          {t.training.nameLabel}
        </Txt>
        <TextInput
          value={nameText}
          onChangeText={(v) => {
            setName(v);
            setError(null);
          }}
          placeholder={t.training.namePlaceholder}
          placeholderTextColor={theme.textMuted}
          aria-label={t.training.nameLabel}
          style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: radius.button, backgroundColor: theme.surface, color: theme.text, fontSize: 17 }}
        />
      </View>

      <View style={{ gap: space.s }}>
        <Txt variant="label">{t.training.categoryLabel}</Txt>
        <ChipRow>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={t.training.category[c]} selected={draft.category === c} onPress={() => setDraft({ ...draft, category: c })} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.exercisesCount(draft.items.length)}</SectionTitle>
        {draft.items.map((item, i) => {
          const ex = EXERCISE_MAP[item.exerciseId];
          if (!ex) return null;
          return (
            <Section key={`${item.exerciseId}-${i}`} style={{ padding: 12, gap: space.s }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Txt variant="heading" style={{ flex: 1, paddingLeft: 4 }}>
                  {l(ex.name)}
                </Txt>
                <SmallIcon icon="up2" label={t.training.moveUp} disabled={i === 0} onPress={() => move(i, -1)} />
                <SmallIcon icon="down2" label={t.training.moveDown} disabled={i === draft.items.length - 1} onPress={() => move(i, 1)} />
                <SmallIcon icon="trash" label={t.training.removeExercise} onPress={() => setDraft({ ...draft, items: draft.items.filter((_, k) => k !== i) })} />
              </View>
              <View style={{ flexDirection: "row", gap: space.s }}>
                <Field label={t.training.sets} value={item.sets} min={1} max={10} onChange={(v) => updateItem(i, { sets: v })} />
                <Field
                  label={ex.measure === "time" ? t.training.targetSeconds : t.training.targetReps}
                  value={item.target}
                  min={1}
                  max={ex.measure === "time" ? 600 : 100}
                  onChange={(v) => updateItem(i, { target: v })}
                />
                <Field label={t.training.restLabel} value={item.restSeconds} min={0} max={600} onChange={(v) => updateItem(i, { restSeconds: v })} />
              </View>
            </Section>
          );
        })}
        <Button label={t.training.addExercise} kind="secondary" icon="plus" onPress={() => router.push({ pathname: "/exercises", params: { pick: "builder" } })} />
      </View>

      {error ? (
        <Txt variant="caption" color={theme.track} accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : null}
      <Button label={t.training.saveRoutine} onPress={save} />
    </ScrollView>
  );
}

function SmallIcon({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) =>
        ({ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.button, backgroundColor: pressed ? theme.surfaceAlt : "transparent", opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer" }) as ViewStyle
      }
    >
      <Icon name={icon} size={18} color={theme.textMuted} />
    </Pressable>
  );
}

function Field({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const theme = useTheme();
  const [text, setText] = useState(String(value));
  const commit = () => {
    const n = Math.round(Number(text));
    const v = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : value;
    setText(String(v));
    onChange(v);
  };
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Txt variant="caption" muted numberOfLines={1}>
        {label}
      </Txt>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        inputMode="numeric"
        selectTextOnFocus
        aria-label={label}
        style={{ height: 44, borderRadius: radius.button, backgroundColor: theme.surfaceAlt, color: theme.text, fontSize: 17, textAlign: "center", fontVariant: ["tabular-nums"] }}
      />
    </View>
  );
}
