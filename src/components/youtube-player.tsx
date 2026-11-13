import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { useT } from "@/i18n";
import { useAppStore } from "@/store/app-store";
import { radius, useTheme } from "@/theme";
import { Icon } from "./icon";
import { Txt } from "./text";
import { VideoFrame } from "./video-frame";

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  playLabel: string;
  edge?: boolean;
  /** Start straight away, muted and looping, as a demo of the movement. Follows the autoplay setting. */
  ambient?: boolean;
  /** Segment of the video to play, in seconds; the ambient player loops just this part. */
  start?: number;
  end?: number;
}

export function YouTubePlayer(props: YouTubePlayerProps) {
  // Keyed by video so switching exercises resets playback, mute and thumbnail state.
  return <PlayerBody key={props.videoId} {...props} />;
}

function PlayerBody({ videoId, title, playLabel, edge, ambient, start, end }: YouTubePlayerProps) {
  const t = useT();
  const theme = useTheme();
  const autoplay = useAppStore((s) => s.settings.autoplayVideo !== false);
  const live = ambient && autoplay;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <View style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: edge ? 0 : radius.section, borderCurve: "continuous", overflow: "hidden", backgroundColor: theme.navy }}>
      {live ? (
        <>
          <VideoFrame videoId={videoId} title={title} ambient muted={muted} start={start} end={end} />
          <Pressable
            onPress={() => setMuted((m) => !m)}
            accessibilityRole="button"
            accessibilityLabel={muted ? t.training.soundOn : t.training.soundOff}
            style={({ pressed }) =>
              ({
                position: "absolute",
                right: 12,
                top: 12,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "rgba(14,18,56,0.9)" : "rgba(14,18,56,0.7)",
                cursor: "pointer",
              }) as ViewStyle
            }
          >
            <Icon name={muted ? "soundOff" : "soundOn"} size={20} color="#FFFFFF" />
          </Pressable>
        </>
      ) : playing ? (
        <VideoFrame videoId={videoId} title={title} start={start} end={end} />
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
