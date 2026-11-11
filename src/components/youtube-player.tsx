import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { radius, useTheme } from "@/theme";
import { Icon } from "./icon";
import { Txt } from "./text";
import { VideoFrame } from "./video-frame";

/** Shows the thumbnail until tapped, so opening an exercise never starts a download on its own. */
export function YouTubePlayer({ videoId, title, playLabel, edge }: { videoId: string; title: string; playLabel: string; edge?: boolean }) {
  const theme = useTheme();
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setThumbFailed(false);
  }, [videoId]);

  return (
    <View style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: edge ? 0 : radius.section, borderCurve: "continuous", overflow: "hidden", backgroundColor: theme.navy }}>
      {playing ? (
        <VideoFrame videoId={videoId} title={title} />
      ) : (
        <Pressable
          onPress={() => setPlaying(true)}
          accessibilityRole="button"
          accessibilityLabel={playLabel}
          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1, cursor: "pointer" }) as ViewStyle}
        >
          {!thumbFailed ? (
            <Image
              source={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              contentFit="cover"
              onError={() => setThumbFailed(true)}
              accessible={false}
            />
          ) : (
            <View style={{ position: "absolute", left: 16, right: 16, ...(edge ? { top: 12 } : { bottom: 12 }) }}>
              <Txt variant="caption" color={theme.navyMuted} numberOfLines={2}>
                {title}
              </Txt>
            </View>
          )}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}>
              <Icon name="play" size={28} color={theme.onAccent} />
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
}
