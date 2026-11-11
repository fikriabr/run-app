import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import type { Dictionary } from "@/i18n";
import type { Cue, RunState } from "@/lib/run-engine";
import type { GoalKind, Units, WorkoutStep } from "@/lib/types";
import { METERS_PER_MILE } from "@/lib/format";
import { zonePace } from "@/lib/vdot";

function spokenPace(t: Dictionary, secPerKm: number, units: Units): string {
  const perUnit = units === "km" ? secPerKm : secPerKm * (METERS_PER_MILE / 1000);
  let m = Math.floor(perUnit / 60);
  let s = Math.round(perUnit % 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return t.cue.pace(m, s);
}

function stepSentence(t: Dictionary, step: WorkoutStep, vdot: number, goal: GoalKind, units: Units): string {
  const name = step.rep ? `${t.step[step.kind]} ${t.stepRep(step.rep.index, step.rep.of)}` : t.step[step.kind];
  const amount = step.measure === "distance" ? t.cue.distance(step.value) : t.cue.duration(step.value);
  if (!step.zone) return `${t.stepRest}. ${amount}.`;
  const range = zonePace(vdot, step.zone, goal);
  return `${name}. ${amount} ${t.cue.at} ${spokenPace(t, range.fast, units)} ${t.cue.to} ${spokenPace(t, range.slow, units)} ${t.cue.perUnit(units)}.`;
}

export interface CoachOptions {
  t: Dictionary;
  units: Units;
  vdot: number;
  goal: GoalKind;
  voice: boolean;
  splitCues: boolean;
  paceCues: boolean;
}

export function cueText(cue: Cue, run: RunState, o: CoachOptions): string | null {
  const { t } = o;
  switch (cue.type) {
    case "start":
      return run.steps.length > 0 ? null : t.cue.start;
    case "step": {
      const step = run.steps[cue.index];
      return step ? stepSentence(t, step, o.vdot, o.goal, o.units) : null;
    }
    case "split":
      if (!o.splitCues) return null;
      return t.cue.split(cue.number, o.units, `${spokenPace(t, cue.seconds * (1000 / run.splitUnit), o.units)} ${t.cue.perUnit(o.units)}`);
    case "speedUp":
      return o.paceCues ? t.cue.speedUp : null;
    case "slowDown":
      return o.paceCues ? t.cue.slowDown : null;
    case "paused":
      return t.cue.paused;
    case "resumed":
      return t.cue.resumed;
    case "workoutDone":
      return t.cue.workoutDone;
  }
}

/** Speaks and buzzes for each cue. Speech queues natively, so cues are never cut off. */
export function deliverCues(cues: Cue[], run: RunState, o: CoachOptions) {
  for (const cue of cues) {
    if (process.env.EXPO_OS !== "web") {
      if (cue.type === "step" || cue.type === "workoutDone") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (cue.type === "speedUp" || cue.type === "slowDown") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    if (!o.voice) continue;
    const text = cueText(cue, run, o);
    if (text) Speech.speak(text, { language: o.t.speechLanguage, rate: 1.0 });
  }
}
