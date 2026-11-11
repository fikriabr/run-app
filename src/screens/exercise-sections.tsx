import { Linking, TextInput, View } from "react-native";
import { useState } from "react";
import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { Row, Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Num, Txt } from "@/components/text";
import { YouTubePlayer } from "@/components/youtube-player";
import { useFormat } from "@/hooks/use-format";
import { useWeight } from "@/hooks/use-weight";
import { useLocalized, useT } from "@/i18n";
import { exerciseBests, exerciseHistory, formatVideoTime, parseVideoTime, parseYouTubeId, parseYouTubeStart } from "@/lib/training";
import type { Exercise, LoggedSet } from "@/lib/training-types";
import { useTrainingStore } from "@/store/training-store";
import { fonts, radius, space, useTheme } from "@/theme";

export function useExerciseVideo(exercise: Exercise) {
  const override = useTrainingStore((s) => s.videoOverrides[exercise.id]);
  return { video: override ?? exercise.video, isOverride: override != null };
}

/** Steps, safety note, tip, muscles and equipment. */
export function ExerciseHowTo({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const lang = l({ en: "en", id: "id" }) as "en" | "id";
  return (
    <View style={{ gap: space.l }}>
      {exercise.caution ? <Banner icon="missed" tone="attention" title={t.training.caution} body={l(exercise.caution)} /> : null}
      <View style={{ gap: space.m }}>
        <SectionTitle>{t.training.steps}</SectionTitle>
        <Section style={{ padding: 16, gap: space.m }}>
          {exercise.steps[lang].map((step, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.m }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Num size={14} color={theme.primary}>
                  {i + 1}
                </Num>
              </View>
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
      <Section>
        <Row title={t.training.muscles} subtitle={exercise.muscles.map((m) => t.training.muscle[m]).join(", ")} />
        <Row title={t.training.equipmentLabel} subtitle={exercise.equipment.map((e) => t.training.equipment[e]).join(", ")} />
      </Section>
    </View>
  );
}

export function ExerciseHistoryView({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const f = useFormat();
  const w = useWeight();
  const sessions = useTrainingStore((s) => s.sessions);
  const bests = exerciseBests(sessions, exercise.id);
  const history = exerciseHistory(sessions, exercise.id).slice(0, 8);
  const setText = (s: LoggedSet) =>
    [s.weight ? `${w.show(s.weight)} ${w.unit}` : null, s.reps != null ? `${s.reps}×` : null, s.seconds != null ? t.training.seconds(s.seconds) : null]
      .filter(Boolean)
      .join(" ");

  if (bests.sessions === 0) return <Txt muted>{t.training.noHistory}</Txt>;
  return (
    <View style={{ gap: space.l }}>
      <Section style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.xl, rowGap: space.l }}>
          <Stat label={t.training.timesDone} value={String(bests.sessions)} />
          {bests.heaviest ? <Stat label={t.training.heaviest} value={w.show(bests.heaviest)} unit={w.unit} /> : null}
          {bests.oneRepMax ? <Stat label={t.training.oneRepMax} value={w.show(bests.oneRepMax)} unit={w.unit} /> : null}
          {bests.mostReps ? <Stat label={t.training.mostReps} value={String(bests.mostReps)} /> : null}
          {bests.longestHold ? <Stat label={t.training.longestHold} value={t.training.seconds(bests.longestHold)} /> : null}
        </View>
      </Section>
      <Section>
        {history.map((h) => (
          <Row key={h.sessionId} title={f.dateTime(h.at)} subtitle={h.sets.map(setText).join(" · ")} />
        ))}
      </Section>
    </View>
  );
}

/** Watch on YouTube, search for another tutorial, or pin a link of your own. */
export function VideoOptions({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const { video, isOverride } = useExerciseVideo(exercise);
  const setVideo = useTrainingStore((s) => s.setVideo);
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState(false);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name.en} exercise tutorial`)}`;

  const apply = () => {
    const id = parseYouTubeId(link);
    if (!id) return setError(true);
    const start = parseYouTubeStart(link);
    setVideo(exercise.id, { id, title: l(exercise.name), ...(start ? { start } : {}) });
    setEditing(false);
    setLink("");
    setError(false);
  };

  return (
    <View style={{ gap: space.m }}>
      <SectionTitle>{t.training.video}</SectionTitle>
      {video ? (
        <Txt variant="caption" muted numberOfLines={2}>
          {isOverride ? t.training.yourVideo : t.training.videoSource(video.title)}
        </Txt>
      ) : (
        <Txt muted>{t.training.noVideo}</Txt>
      )}
      <View style={{ flexDirection: "row", gap: space.s, flexWrap: "wrap" }}>
        {video ? (
          <Button label={t.training.watchOnYouTube} kind="secondary" icon="video" style={{ flexGrow: 1 }} onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)} />
        ) : null}
        <Button label={t.training.findOtherVideo} kind="secondary" icon="search" style={{ flexGrow: 1 }} onPress={() => void Linking.openURL(searchUrl)} />
      </View>
      {video ? <SegmentEditor exercise={exercise} /> : null}
      {editing ? (
        <Section style={{ padding: 16, gap: space.m }}>
          <Txt variant="label">{t.training.videoLinkLabel}</Txt>
          <TextInput
            value={link}
            onChangeText={(v) => {
              setLink(v);
              setError(false);
            }}
            placeholder={t.training.videoLinkPlaceholder}
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="url"
            aria-label={t.training.videoLinkLabel}
            style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: radius.button, backgroundColor: theme.surfaceAlt, color: theme.text, fontFamily: fonts.medium, fontSize: 16 }}
          />
          {error ? (
            <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite">
              {t.training.videoInvalid}
            </Txt>
          ) : null}
          <View style={{ flexDirection: "row", gap: space.s }}>
            <Button label={t.common.cancel} kind="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            <Button label={t.training.useVideo} onPress={apply} style={{ flex: 1 }} />
          </View>
        </Section>
      ) : (
        <View style={{ flexDirection: "row", gap: space.s, flexWrap: "wrap" }}>
          <Button label={t.training.changeVideo} kind="plain" icon="edit" onPress={() => setEditing(true)} />
          {isOverride ? <Button label={t.training.resetVideo} kind="plain" onPress={() => setVideo(exercise.id, null)} /> : null}
        </View>
      )}
    </View>
  );
}

/** Edge-to-edge video with the title card overlapping its bottom edge. */
export function ExerciseHero({ exercise, subtitle, children }: { exercise: Exercise; subtitle?: string; children?: React.ReactNode }) {
  const t = useT();
  const l = useLocalized();
  const theme = useTheme();
  const { video } = useExerciseVideo(exercise);
  const name = l(exercise.name);
  return (
    <View>
      {video ? (
        <YouTubePlayer videoId={video.id} title={video.title} playLabel={t.training.playVideo(name)} edge ambient start={video.start} end={video.end} />
      ) : (
        <View style={{ height: 120, backgroundColor: theme.navy }} />
      )}
      <View
        style={{
          marginTop: -32,
          marginHorizontal: 16,
          backgroundColor: theme.surface,
          borderRadius: radius.card,
          borderCurve: "continuous",
          padding: 20,
          gap: space.s,
          alignItems: "center",
        }}
      >
        <Txt variant="title" accessibilityRole="header" style={{ textAlign: "center" }}>
          {name}
        </Txt>
        {subtitle ? (
          <Txt variant="heading" color={theme.textMuted} style={{ textAlign: "center", fontFamily: fonts.medium, fontSize: 15 }}>
            {subtitle}
          </Txt>
        ) : null}
        {children}
      </View>
    </View>
  );
}

/** Picks which part of the video loops, so the demo shows the movement instead of the intro. */
function SegmentEditor({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const theme = useTheme();
  const { video } = useExerciseVideo(exercise);
  const setVideo = useTrainingStore((s) => s.setVideo);
  const [start, setStart] = useState(video?.start != null ? formatVideoTime(video.start) : "");
  const [end, setEnd] = useState(video?.end != null ? formatVideoTime(video.end) : "");
  const [error, setError] = useState(false);
  if (!video) return null;

  const save = () => {
    const s = start.trim() ? parseVideoTime(start) : 0;
    const e = end.trim() ? parseVideoTime(end) : null;
    if (s == null || (end.trim() && e == null) || (e != null && e <= (s ?? 0))) return setError(true);
    setError(false);
    setVideo(exercise.id, { ...video, start: s || undefined, end: e ?? undefined });
  };

  const whole = () => {
    setStart("");
    setEnd("");
    setError(false);
    setVideo(exercise.id, { id: video.id, title: video.title });
  };

  const field = (label: string, value: string, onChange: (v: string) => void) => (
    <View style={{ flex: 1, gap: 4 }}>
      <Txt variant="caption" muted>
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={(v) => {
          onChange(v);
          setError(false);
        }}
        placeholder="0:00"
        placeholderTextColor={theme.textMuted}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        aria-label={label}
        style={{ height: 48, borderRadius: radius.button, backgroundColor: theme.surfaceAlt, color: theme.text, fontFamily: fonts.bold, fontSize: 18, textAlign: "center", fontVariant: ["tabular-nums"] }}
      />
    </View>
  );

  return (
    <Section style={{ padding: 16, gap: space.m }}>
      <View style={{ gap: 2 }}>
        <Txt variant="heading">{t.training.segmentTitle}</Txt>
        <Txt variant="caption" muted>
          {video.start != null || video.end != null
            ? t.training.segmentCurrent(formatVideoTime(video.start ?? 0), video.end != null ? formatVideoTime(video.end) : t.training.segmentToEnd)
            : t.training.segmentWholeVideo}
        </Txt>
      </View>
      <Txt variant="caption" muted>
        {t.training.segmentHint}
      </Txt>
      <View style={{ flexDirection: "row", gap: space.s }}>
        {field(t.training.segmentStart, start, setStart)}
        {field(t.training.segmentEnd, end, setEnd)}
      </View>
      {error ? (
        <Txt variant="caption" color={theme.accentText} accessibilityLiveRegion="polite">
          {t.training.segmentInvalid}
        </Txt>
      ) : null}
      <View style={{ flexDirection: "row", gap: space.s }}>
        <Button label={t.training.segmentWhole} kind="secondary" onPress={whole} style={{ flex: 1 }} />
        <Button label={t.training.segmentSave} onPress={save} style={{ flex: 1 }} />
      </View>
    </Section>
  );
}
