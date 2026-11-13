import type { ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Share, View } from "react-native";
import { Button } from "@/components/button";
import { Txt } from "@/components/text";
import { useT } from "@/i18n";
import { recordCrash } from "@/services/crash-log";
import { screenContent, space, useTheme } from "@/theme";

/** Shown instead of a blank crash when a screen throws while rendering. */
export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const t = useT();
  const theme = useTheme();
  useEffect(() => recordCrash(error, false), [error]);
  const details = `${error.name}: ${error.message}\n\n${error.stack ?? ""}`.slice(0, 4000);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ ...screenContent, paddingTop: 64, gap: space.l }}>
      <Txt variant="title" accessibilityRole="header">
        {t.crash.title}
      </Txt>
      <Txt muted>{t.crash.body}</Txt>
      <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16 }}>
        <Txt variant="caption" selectable>
          {details}
        </Txt>
      </View>
      <Button label={t.crash.share} kind="secondary" onPress={() => void Share.share({ message: details })} />
      <Button label={t.crash.retry} onPress={retry} />
    </ScrollView>
  );
}
