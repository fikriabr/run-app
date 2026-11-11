import { router } from "expo-router";
import { Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { Icon, type IconName } from "@/components/icon";
import { Txt } from "@/components/text";
import { useToday } from "@/hooks/use-today";
import { useLocalized, useT } from "@/i18n";
import { useAppStore } from "@/store/app-store";
import { findRoutine, useActiveSession, useTrainingStore } from "@/store/training-store";
import { radius, screenContent, space, useTheme } from "@/theme";

export function QuickStartScreen() {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const today = useToday();
  const slot = useAppStore((s) => s.plan?.strength?.find((x) => x.date === today && x.status === "planned"));
  const custom = useTrainingStore((s) => s.customRoutines);
  const routine = findRoutine(slot?.routineId, custom);
  const hasActive = useActiveSession((s) => s.active != null);

  const options: { icon: IconName; title: string; hint: string; tint: string; soft: string; onPress: () => void }[] = [
    { icon: "run", title: t.quickStart.run, hint: t.quickStart.runHint, tint: theme.accentText, soft: theme.accentSoft, onPress: () => router.replace("/run") },
  ];
  if (hasActive) {
    options.push({ icon: "play", title: t.training.resume, hint: "", tint: theme.text, soft: theme.yellowSoft, onPress: () => router.replace("/session") });
  } else {
    if (slot && routine) {
      options.push({
        icon: "strength",
        title: t.quickStart.scheduled,
        hint: l(routine.name),
        tint: theme.text,
        soft: theme.yellowSoft,
        onPress: () => {
          useTrainingStore.getState().startFromRoutine(routine.id, slot.id);
          router.replace("/session");
        },
      });
    }
    options.push({
      icon: "plus",
      title: t.quickStart.empty,
      hint: t.quickStart.emptyHint,
      tint: theme.primary,
      soft: theme.primarySoft,
      onPress: () => {
        useTrainingStore.getState().startEmpty({ en: "Workout", id: "Latihan" });
        router.replace("/session");
      },
    });
  }
  options.push(
    { icon: "strength", title: t.quickStart.routine, hint: t.quickStart.routineHint, tint: theme.primary, soft: theme.primarySoft, onPress: () => router.replace("/training") },
    { icon: "book", title: t.quickStart.library, hint: t.quickStart.libraryHint, tint: theme.primary, soft: theme.primarySoft, onPress: () => router.replace("/exercises") },
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.s }}>
      {options.map((o) => (
        <Pressable
          key={o.title}
          onPress={o.onPress}
          accessibilityRole="button"
          accessibilityLabel={o.hint ? `${o.title}. ${o.hint}` : o.title}
          style={({ pressed }) =>
            ({
              flexDirection: "row",
              alignItems: "center",
              gap: space.m,
              padding: 16,
              borderRadius: radius.section,
              backgroundColor: pressed ? theme.surfaceAlt : theme.surface,
              cursor: "pointer",
            }) as ViewStyle
          }
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: o.soft, alignItems: "center", justifyContent: "center" }}>
            <Icon name={o.icon} size={20} color={o.tint} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">{o.title}</Txt>
            {o.hint ? (
              <Txt variant="caption" muted>
                {o.hint}
              </Txt>
            ) : null}
          </View>
          <Icon name="chevron" size={14} color={theme.primary} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
