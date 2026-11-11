import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";
import type { Exercise } from "@/lib/training-types";
import { useTrainingStore } from "@/store/training-store";
import { radius, useTheme } from "@/theme";
import { Icon } from "./icon";

/** A frame from the exercise's own tutorial video; a navy tile with the category icon when offline or without video. */
export function ExerciseThumb({ exercise, size = 72 }: { exercise: Exercise; size?: number }) {
  const theme = useTheme();
  const override = useTrainingStore((s) => s.videoOverrides[exercise.id]);
  const video = override ?? exercise.video;
  const [failed, setFailed] = useState(false);
  const hard = exercise.category === "strength" || exercise.category === "plyometric";

  return (
    <View
      style={{ width: size, height: size, borderRadius: radius.button, borderCurve: "continuous", overflow: "hidden", backgroundColor: theme.navy, alignItems: "center", justifyContent: "center" }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {video && !failed ? (
        <Image
          source={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
          style={{ width: size, height: size }}
          contentFit="cover"
          onError={() => setFailed(true)}
          recyclingKey={video.id}
        />
      ) : (
        <Icon name={hard ? "strength" : exercise.category === "yoga" || exercise.category === "mobility" ? "run" : "you"} size={size * 0.4} color={hard ? theme.accent : theme.navyMuted} />
      )}
    </View>
  );
}
