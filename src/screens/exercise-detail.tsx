import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, TextInput, View } from "react-native";
import { Banner, EmptyState } from "@/components/banner";
import { Button } from "@/components/button";
import { Row, Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Num, Txt } from "@/components/text";
import { YouTubePlayer } from "@/components/youtube-player";
import { EXERCISE_MAP } from "@/data/exercises";
import { useFormat } from "@/hooks/use-format";
import { useWeight } from "@/hooks/use-weight";
import { useLocalized, useT } from "@/i18n";
import { exerciseBests, exerciseHistory, parseYouTubeId } from "@/lib/training";
import { useTrainingStore } from "@/store/training-store";
import { radius, screenContent, space, useTheme } from "@/theme";

export function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const l = useLocalized();
  const f = useFormat();
  const w = useWeight();
  const theme = useTheme();
  const sessions = useTrainingStore((s) => s.sessions);
  const override = useTrainingStore((s) => (id ? s.videoOverrides[id] : undefined));
  const setVideo = useTrainingStore((s) => s.setVideo);
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState(false);
  const exercise = id ? EXERCISE_MAP[id] : undefined;

  if (!exercise) return <EmptyState icon="missed" title={t.common.errorTitle} body={t.training.noResults} />;

  const name = l(exercise.name);
  const video = override ?? exercise.video;
  const lang = l({ en: "en", id: "id" }) as "en" | "id";
  const bests = exerciseBests(sessions, exercise.id);
  const history = exerciseHistory(sessions, exercise.id).slice(0, 5);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name.en} exercise tutorial`)}`;

  const applyLink = () => {
    const videoId = parseYouTubeId(link);
    if (!videoId) {
      setLinkError(true);
      return;
    }
    setVideo(exercise.id, { id: videoId, title: name });
    setEditing(false);
    setLink("");
    setLinkError(false);
  };

  const setText = (s: { reps: number | null; weight: number | null; seconds: number | null }) =>
    [s.weight ? `${w.show(s.weight)} ${w.unit}` : null, s.reps != null ? `${s.reps}×` : null, s.seconds != null ? t.training.seconds(s.seconds) : null]
      .filter(Boolean)
      .join(" ");

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <Stack.Screen options={{ title: name }} />

      <View style={{ gap: space.m }}>
        {video ? (
          <>
            <YouTubePlayer videoId={video.id} title={video.title} playLabel={t.training.playVideo(name)} />
            <Txt variant="caption" muted numberOfLines={2}>
              {override ? t.training.yourVideo : t.training.videoSource(video.title)}
            </Txt>
          </>
        ) : (
          <Txt muted>{t.training.noVideo}</Txt>
        )}
        <View style={{ flexDirection: "row", gap: space.s, flexWrap: "wrap" }}>
          {video ? (
            <Button label={t.training.watchOnYouTube} kind="secondary" icon="video" style={{ flexGrow: 1 }} onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)} />
          ) : null}
          <Button label={t.training.findOtherVideo} kind="secondary" icon="search" style={{ flexGrow: 1 }} onPress={() => void Linking.openURL(searchUrl)} />
        </View>
        {editing ? (
          <Section style={{ padding: 16, gap: space.m }}>
            <Txt variant="label">{t.training.videoLinkLabel}</Txt>
            <TextInput
              value={link}
              onChangeText={(v) => {
                setLink(v);
                setLinkError(false);
              }}
              placeholder={t.training.videoLinkPlaceholder}
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="url"
              aria-label={t.training.videoLinkLabel}
              style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: radius.button, backgroundColor: theme.surfaceAlt, color: theme.text, fontSize: 16 }}
            />
            {linkError ? (
              <Txt variant="caption" color={theme.track} accessibilityLiveRegion="polite">
                {t.training.videoInvalid}
              </Txt>
            ) : null}
            <View style={{ flexDirection: "row", gap: space.s }}>
              <Button label={t.common.cancel} kind="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <Button label={t.training.useVideo} onPress={applyLink} style={{ flex: 1 }} />
            </View>
          </Section>
        ) : (
          <View style={{ flexDirection: "row", gap: space.s, flexWrap: "wrap" }}>
            <Button label={t.training.changeVideo} kind="plain" icon="edit" onPress={() => setEditing(true)} />
            {override ? <Button label={t.training.resetVideo} kind="plain" onPress={() => setVideo(exercise.id, null)} /> : null}
          </View>
        )}
      </View>

      <Txt variant="label" muted>
        {t.training.category[exercise.category]} · {exercise.equipment.map((e) => t.training.equipment[e]).join(", ")}
      </Txt>

      {exercise.caution ? <Banner icon="missed" tone="attention" title={t.training.caution} body={l(exercise.caution)} /> : null}

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.steps}</SectionTitle>
        <Section style={{ padding: 16, gap: space.m }}>
          {exercise.steps[lang].map((step, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.m }}>
              <Num size={22} color={theme.track} style={{ width: 20 }}>
                {i + 1}
              </Num>
              <Txt style={{ flex: 1 }}>{step}</Txt>
            </View>
          ))}
        </Section>
        {exercise.tip ? (
          <Txt muted>
            {t.training.tip}: {l(exercise.tip)}
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.muscles}</SectionTitle>
        <Txt>{exercise.muscles.map((m) => t.training.muscle[m]).join(", ")}</Txt>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.history}</SectionTitle>
        {bests.sessions === 0 ? (
          <Txt muted>{t.training.noHistory}</Txt>
        ) : (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.xl, rowGap: space.l }}>
              <Stat label={t.training.timesDone} value={String(bests.sessions)} />
              {bests.heaviest ? <Stat label={t.training.heaviest} value={w.show(bests.heaviest)} unit={w.unit} /> : null}
              {bests.oneRepMax ? <Stat label={t.training.oneRepMax} value={w.show(bests.oneRepMax)} unit={w.unit} /> : null}
              {bests.mostReps ? <Stat label={t.training.mostReps} value={String(bests.mostReps)} /> : null}
              {bests.longestHold ? <Stat label={t.training.longestHold} value={t.training.seconds(bests.longestHold)} /> : null}
            </View>
            <Section>
              {history.map((h) => (
                <Row key={h.sessionId} title={f.dateTime(h.at)} subtitle={h.sets.map(setText).join(" · ")} />
              ))}
            </Section>
          </>
        )}
      </View>
    </ScrollView>
  );
}
