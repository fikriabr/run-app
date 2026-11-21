import { useMemo, useState } from "react";
import { View } from "react-native";
import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { Section } from "@/components/section";
import { Txt } from "@/components/text";
import { useFormat } from "@/hooks/use-format";
import { useToday } from "@/hooks/use-today";
import { useT } from "@/i18n";
import { MIN_GAP_METERS, rebalanceWeek } from "@/lib/rebalance";
import { useAppStore } from "@/store/app-store";
import { space } from "@/theme";
import { EffortMark } from "./workout-card";

/**
 * Shows how far a week is from its target and offers to resize the runs left in it.
 * Renders nothing when the week is on target.
 */
export function RebalanceCard({ weekIndex, onSettled }: { weekIndex: number; onSettled?: () => void }) {
  const t = useT();
  const f = useFormat();
  const today = useToday();
  const plan = useAppStore((s) => s.plan);
  const activities = useAppStore((s) => s.activities);
  const vdot = useAppStore((s) => s.vdot);
  const apply = useAppStore((s) => s.rebalanceWeek);
  const [state, setState] = useState<"open" | "applied" | "kept">("open");

  const preview = useMemo(
    () => (plan ? rebalanceWeek(plan, weekIndex, activities, vdot ?? plan.input.vdot, today) : null),
    [plan, weekIndex, activities, vdot, today],
  );

  if (state === "applied") return <Banner icon="check" tone="good" title={t.log.applied} />;
  if (state === "kept" || !preview || Math.abs(preview.balance.gap) < MIN_GAP_METERS) return null;

  const gap = f.distanceWithUnit(Math.abs(preview.balance.gap));
  const settle = (next: "applied" | "kept") => {
    if (next === "applied") apply(weekIndex, today);
    setState(next);
    onSettled?.();
  };

  return (
    <View style={{ gap: space.m }}>
      <Banner icon={preview.balance.gap > 0 ? "down" : "up"} tone="attention" title={preview.balance.gap > 0 ? t.log.shortBody(gap) : t.log.overBody(gap)} />
      {preview.changes.length === 0 ? (
        <Txt muted>{t.log.nothingToChange}</Txt>
      ) : (
        <>
          <Txt variant="label" muted>
            {t.log.proposal}
          </Txt>
          <Section>
            {preview.changes.map((c) => (
              <View key={c.workoutId} style={{ flexDirection: "row", alignItems: "center", gap: space.m, paddingHorizontal: 16, paddingVertical: 12, minHeight: 52 }}>
                <EffortMark type={c.type} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt>{t.workout[c.type]}</Txt>
                  <Txt variant="caption" muted>
                    {f.day(c.date)}
                  </Txt>
                </View>
                <Txt selectable style={{ fontVariant: ["tabular-nums"] }}>
                  {t.log.change(f.distance(c.from, 1), f.distanceWithUnit(c.to))}
                </Txt>
              </View>
            ))}
          </Section>
          <Txt variant="caption" muted>
            {t.log.proposalHint}
            {preview.dropped >= MIN_GAP_METERS ? ` ${t.log.dropped(f.distanceWithUnit(preview.dropped))}` : ""}
          </Txt>
          <View style={{ gap: space.s }}>
            <Button label={t.log.apply} onPress={() => settle("applied")} />
            <Button label={t.log.keep} kind="secondary" onPress={() => settle("kept")} />
          </View>
        </>
      )}
    </View>
  );
}

/** Plan-tab entry: a quiet button that opens the recalculation when the week is off target. */
export function RebalanceButton({ weekIndex }: { weekIndex: number }) {
  const t = useT();
  const f = useFormat();
  const today = useToday();
  const plan = useAppStore((s) => s.plan);
  const activities = useAppStore((s) => s.activities);
  const vdot = useAppStore((s) => s.vdot);
  const [open, setOpen] = useState(false);
  const balance = useMemo(
    () => (plan ? rebalanceWeek(plan, weekIndex, activities, vdot ?? plan.input.vdot, today) : null),
    [plan, weekIndex, activities, vdot, today],
  );

  if (open) return <RebalanceCard weekIndex={weekIndex} />;
  if (!balance || balance.changes.length === 0) return null;
  return (
    <View style={{ gap: space.xs }}>
      <Button label={t.plan.rebalance} kind="secondary" icon="plan" onPress={() => setOpen(true)} />
      <Txt variant="caption" muted>
        {t.plan.rebalanceHint(f.distanceWithUnit(Math.abs(balance.balance.gap)))}
      </Txt>
    </View>
  );
}
