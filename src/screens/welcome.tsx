import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { Button } from "@/components/button";
import { Icon, type IconName } from "@/components/icon";
import { Txt } from "@/components/text";
import { useT } from "@/i18n";
import { useAppStore } from "@/store/app-store";
import { radius, screenContent, space, useTheme } from "@/theme";

type Choice = "run" | "strength" | "diet";

/** Steps still to set up, in order; strength needs no setup. */
export function nextOnboardingStep(steps: string[]) {
  const [next, ...rest] = steps;
  if (!next) {
    useAppStore.getState().finishOnboarding();
    return;
  }
  router.push({ pathname: next === "run" ? "/onboarding/run" : "/onboarding/diet", params: { next: rest.join(",") } });
}

export function WelcomeScreen() {
  const t = useT();
  const [picked, setPicked] = useState<Choice[]>(["run"]);
  const options: [Choice, IconName, string, string][] = [
    ["run", "run", t.welcome.run, t.welcome.runBody],
    ["strength", "strength", t.welcome.strength, t.welcome.strengthBody],
    ["diet", "food", t.welcome.diet, t.welcome.dietBody],
  ];
  const toggle = (c: Choice) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const steps = (["run", "diet"] as const).filter((c) => picked.includes(c));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Txt muted>{t.welcome.subtitle}</Txt>
      <View style={{ gap: space.m }}>
        {options.map(([key, icon, title, body]) => (
          <ChoiceCard key={key} icon={icon} title={title} body={body} selected={picked.includes(key)} onPress={() => toggle(key)} />
        ))}
      </View>
      <View style={{ gap: space.s }}>
        <Button label={t.welcome.next} onPress={() => nextOnboardingStep([...steps])} />
        <Button label={t.welcome.explore} kind="plain" onPress={() => nextOnboardingStep([])} />
      </View>
    </ScrollView>
  );
}

function ChoiceCard({ icon, title, body, selected, onPress }: { icon: IconName; title: string; body: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${body}`}
      style={({ pressed }) =>
        ({
          flexDirection: "row",
          alignItems: "center",
          gap: space.m,
          padding: 16,
          borderRadius: radius.card,
          borderCurve: "continuous",
          backgroundColor: theme.surface,
          borderWidth: 2,
          borderColor: selected ? theme.primary : "transparent",
          opacity: pressed ? 0.85 : 1,
          cursor: "pointer",
        }) as ViewStyle
      }
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: selected ? theme.primary : theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={24} color={selected ? theme.onPrimary : theme.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="heading">{title}</Txt>
        <Txt variant="caption" muted>
          {body}
        </Txt>
      </View>
      <Icon name={selected ? "check" : "plus"} size={24} color={selected ? theme.primary : theme.textMuted} />
    </Pressable>
  );
}
