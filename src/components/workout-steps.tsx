import { View } from "react-native";
import { formatDuration } from "@/lib/format";
import type { GoalKind, WorkoutStep } from "@/lib/types";
import { useT } from "@/i18n";
import { useFormat } from "@/hooks/use-format";
import { space, useTheme } from "@/theme";
import { Txt } from "./text";

type Group =
  | { kind: "single"; step: WorkoutStep }
  | { kind: "repeat"; of: number; work: WorkoutStep; recover: WorkoutStep | null };

export function groupSteps(steps: WorkoutStep[]): Group[] {
  const groups: Group[] = [];
  let i = 0;
  while (i < steps.length) {
    const step = steps[i];
    if (step.rep && step.rep.index === 1 && step.kind === "work") {
      const next = steps[i + 1];
      const recover = next && next.kind === "recover" && next.rep?.index === 1 ? next : null;
      groups.push({ kind: "repeat", of: step.rep.of, work: step, recover });
      // Consume the whole block: every step carrying this repeat until the next block starts.
      let j = i + 1;
      while (j < steps.length && steps[j].rep && !(steps[j].kind === "work" && steps[j].rep!.index === 1)) j++;
      i = j;
      continue;
    }
    groups.push({ kind: "single", step });
    i++;
  }
  return groups;
}

export function useStepText() {
  const t = useT();
  const f = useFormat();
  const amount = (step: WorkoutStep) =>
    step.measure === "distance"
      ? step.value >= 1000 || f.units === "mi"
        ? f.distanceWithUnit(step.value, step.value % 1000 === 0 && f.units === "km" ? 0 : 1)
        : `${step.value} m`
      : formatDuration(step.value);
  const target = (step: WorkoutStep, vdot: number, goal: GoalKind) =>
    step.zone ? `${t.zone[step.zone]} · ${f.zoneRange(vdot, step.zone, goal)} ${f.perUnit}` : t.stepRest;
  return { amount, target };
}

export function WorkoutSteps({ steps, vdot, goal }: { steps: WorkoutStep[]; vdot: number; goal: GoalKind }) {
  const t = useT();
  const theme = useTheme();
  const { amount, target } = useStepText();
  const groups = groupSteps(steps);

  return (
    <View style={{ gap: space.m }}>
      {groups.map((g, i) => {
        if (g.kind === "single") {
          return (
            <View key={i} style={{ flexDirection: "row", gap: space.m }}>
              <Txt variant="heading" style={{ width: 92 }}>
                {amount(g.step)}
              </Txt>
              <View style={{ flex: 1 }}>
                <Txt variant="body">{t.step[g.step.kind]}</Txt>
                <Txt variant="caption" muted selectable>
                  {target(g.step, vdot, goal)}
                </Txt>
              </View>
            </View>
          );
        }
        return (
          <View key={i} style={{ flexDirection: "row", gap: space.m }}>
            <Txt variant="heading" color={theme.accentText} style={{ width: 92 }}>
              {t.repeatTimes(g.of)}
            </Txt>
            <View style={{ flex: 1, gap: space.s }}>
              <View>
                <Txt variant="body">{amount(g.work)}</Txt>
                <Txt variant="caption" muted selectable>
                  {target(g.work, vdot, goal)}
                </Txt>
              </View>
              {g.recover ? (
                <View>
                  <Txt variant="body">
                    {amount(g.recover)} {g.recover.zone ? t.stepJog : t.stepRest.toLowerCase()}
                  </Txt>
                  {g.recover.zone ? (
                    <Txt variant="caption" muted>
                      {target(g.recover, vdot, goal)}
                    </Txt>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
