import { pickVideo } from "@/lib/training";
import type { Exercise } from "@/lib/training-types";
import { useAppStore } from "@/store/app-store";
import { useTrainingStore } from "@/store/training-store";

/** The video shown for an exercise: the runner's own pick first, then the default for their chosen model. */
export function useExerciseVideo(exercise: Exercise) {
  const override = useTrainingStore((s) => s.videoOverrides[exercise.id]);
  const model = useAppStore((s) => s.settings.videoModel ?? "male");
  return { video: override ?? pickVideo(exercise, model), isOverride: override != null };
}
