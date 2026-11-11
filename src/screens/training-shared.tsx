import { router } from "expo-router";
import { View } from "react-native";
import { useT } from "@/i18n";
import type { Exercise, ExerciseCategory, RoutineItem } from "@/lib/training-types";
import { useActiveSession, useTrainingStore } from "@/store/training-store";
import { confirm } from "@/services/confirm";
import { radius, useTheme } from "@/theme";

/** Small block in the category colour: the lane motif reused as a category marker. */
export function CategoryMark({ category, size = 12 }: { category: ExerciseCategory; size?: number }) {
  const theme = useTheme();
  const hard = category === "strength" || category === "plyometric";
  return <View style={{ width: size, height: size, borderRadius: radius.lane, backgroundColor: hard ? theme.accent : theme.primary }} />;
}

export function useTargetText() {
  const t = useT();
  return (exercise: Exercise, item: Pick<RoutineItem, "sets" | "target">) => {
    const target = exercise.measure === "time" ? t.training.seconds(item.target) : t.training.reps(item.target);
    return `${t.training.setsTarget(item.sets, target)}${exercise.perSide ? ` ${t.training.perSide}` : ""}`;
  };
}

/** Starts a routine, asking before it replaces a workout already in progress. */
export function useStartRoutine() {
  const t = useT();
  return async (routineId: string, slotId?: string) => {
    if (useActiveSession.getState().active) {
      const ok = await confirm(t.training.replaceTitle, t.training.replaceBody, t.training.replace, t.common.cancel, true);
      if (!ok) return;
    }
    if (useTrainingStore.getState().startFromRoutine(routineId, slotId)) router.push("/session");
  };
}
