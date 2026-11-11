import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/i18n";
import { formatDuration } from "@/lib/format";
import { useActiveSession } from "@/store/training-store";
import { radius, space, useTheme } from "@/theme";
import { Num, Txt } from "./text";

/** Countdown pinned to the bottom of the workout screens while a rest is running. */
export function RestBar() {
  const t = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const restEndsAt = useActiveSession((s) => s.restEndsAt);
  const restTotal = useActiveSession((s) => s.restTotal);
  const [now, setNow] = useState(Date.now());
  const alerted = useRef<number | null>(null);

  useEffect(() => {
    if (!restEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [restEndsAt]);

  const left = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : null;
  useEffect(() => {
    if (restEndsAt && left != null && left <= 0 && alerted.current !== restEndsAt) {
      alerted.current = restEndsAt;
      if (process.env.EXPO_OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => useActiveSession.getState().clearRest(), 3000);
      return () => clearTimeout(timer);
    }
  }, [restEndsAt, left]);

  if (!restEndsAt || left == null) return null;
  const fraction = Math.max(0, Math.min(1, left / Math.max(1, restTotal)));

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: insets.bottom + 12,
        maxWidth: 656,
        alignSelf: "center",
        backgroundColor: theme.navy,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: 14,
        gap: 10,
        boxShadow: "0 8px 24px rgba(14, 18, 56, 0.35)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.m }}>
        <View style={{ flex: 1 }}>
          <Txt variant="label" color={theme.navyMuted}>
            {left > 0 ? t.training.resting : t.training.restDone}
          </Txt>
          <Num size={32} color={theme.onNavy}>
            {formatDuration(Math.max(0, left))}
          </Num>
        </View>
        <RestButton label="−15" onPress={() => useActiveSession.getState().adjustRest(-15)} />
        <RestButton label="+15" onPress={() => useActiveSession.getState().adjustRest(15)} />
        <RestButton label={t.training.skipRest} strong onPress={() => useActiveSession.getState().clearRest()} />
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)" }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.accent, width: `${fraction * 100}%` }} />
      </View>
    </View>
  );
}

function RestButton({ label, onPress, strong }: { label: string; onPress: () => void; strong?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) =>
        ({
          minWidth: 52,
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: strong ? theme.accent : pressed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
          cursor: "pointer",
        }) as ViewStyle
      }
    >
      <Txt variant="heading" color={strong ? theme.onAccent : theme.onNavy}>
        {label}
      </Txt>
    </Pressable>
  );
}
