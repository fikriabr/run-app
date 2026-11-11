import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { BarChart } from "@/components/bar-chart";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { Row, Section, SectionTitle } from "@/components/section";
import { Stat } from "@/components/stat";
import { Num, Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useT } from "@/i18n";
import { formatDuration } from "@/lib/format";
import { personalBests, weeklyTotals, weekStreak } from "@/lib/stats";
import type { Zone } from "@/lib/types";
import { GOAL_DISTANCE, predictRaceTime } from "@/lib/vdot";
import { useAppStore } from "@/store/app-store";
import { radius, space, useTheme, screenContent } from "@/theme";

const ZONES: Zone[] = ["easy", "long", "marathon", "threshold", "interval", "repetition"];
const RACES = ["5k", "10k", "half", "marathon"] as const;

export function YouScreen() {
  const t = useT();
  const f = useFormat();
  const theme = useTheme();
  const vdot = useAppStore((s) => s.vdot) ?? 40;
  const goal = useAppStore((s) => s.plan?.input.goal) ?? "10k";
  const activities = useAppStore((s) => s.activities);
  const history = useAppStore((s) => s.fitnessHistory);
  const now = new Date();
  const weeks = weeklyTotals(activities, 12, now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthDistance = activities.filter((a) => a.startedAt >= monthStart).reduce((s, a) => s + a.distance, 0);
  const bests = personalBests(activities);
  const streak = weekStreak(activities, now);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ ...screenContent, gap: space.xl }}>
      <View style={{ backgroundColor: theme.surface, borderRadius: radius.section, borderCurve: "continuous", padding: 20, gap: space.m }}>
        <Txt variant="label" muted>
          {t.you.fitness}
        </Txt>
        <Num size={64} selectable color={theme.track}>
          {vdot.toFixed(1)}
        </Num>
        <Txt variant="caption" muted>
          {t.you.fitnessHint}
        </Txt>
        <Button label={t.you.update} kind="secondary" onPress={() => router.push("/fitness")} />
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.you.predictions}</SectionTitle>
        <Section>
          {RACES.map((r) => (
            <Row key={r} title={t.goal[r]} value={formatDuration(predictRaceTime(vdot, GOAL_DISTANCE[r]))} />
          ))}
        </Section>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.you.zones}</SectionTitle>
        <Section>
          {ZONES.map((z) => (
            <Row key={z} title={t.zone[z]} value={`${f.zoneRange(vdot, z, goal)} ${f.perUnit}`} />
          ))}
        </Section>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.you.weekly}</SectionTitle>
        <Section style={{ padding: 16 }}>
          {activities.length === 0 ? (
            <Txt muted>{t.you.weeklyEmpty}</Txt>
          ) : (
            <BarChart
              bars={weeks.map((w, i) => ({ value: w.distance, label: f.day(w.start), highlight: i === weeks.length - 1 }))}
              accessibilityLabel={weeks.map((w) => `${f.day(w.start)}: ${f.distanceWithUnit(w.distance)}`).join(", ")}
              format={(v) => f.distanceWithUnit(v, 0)}
            />
          )}
        </Section>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.you.totals}</SectionTitle>
        <View style={{ flexDirection: "row", gap: space.l, flexWrap: "wrap" }}>
          <Stat label={t.you.thisMonth} value={f.distance(monthDistance, 1)} unit={f.unit} />
          <Stat label={t.you.allRuns} value={String(activities.length)} />
          <Stat label={t.you.streak} value={t.you.weeksStreak(streak)} />
        </View>
      </View>

      <View style={{ gap: space.m }}>
        <SectionTitle>{t.you.bests}</SectionTitle>
        {bests.length === 0 ? (
          <Txt muted>{t.you.bestsEmpty}</Txt>
        ) : (
          <Section>
            {bests.map((b) => (
              <Row
                key={b.key}
                title={t.effort[b.key]}
                subtitle={f.dateTime(b.at)}
                value={formatDuration(b.seconds)}
                onPress={() => router.push({ pathname: "/runs/[id]", params: { id: b.activityId } })}
              />
            ))}
          </Section>
        )}
      </View>

      {history.length > 0 ? (
        <View style={{ gap: space.m }}>
          <SectionTitle>{t.you.history}</SectionTitle>
          <Section>
            {history.slice(0, 8).map((h, i) => (
              <Row
                key={`${h.at}-${i}`}
                title={`${h.from.toFixed(1)} → ${h.to.toFixed(1)}`}
                subtitle={`${t.you.reason[h.reason]} · ${f.dateTime(h.at)}`}
                leading={<Icon name={h.to >= h.from ? "up" : "down"} size={18} color={h.to >= h.from ? theme.field : theme.track} />}
              />
            ))}
          </Section>
        </View>
      ) : null}

      <Section>
        <Row title={t.you.settings} leading={<Icon name="settings" size={20} color={theme.text} />} onPress={() => router.push("/settings")} />
      </Section>
    </ScrollView>
  );
}
