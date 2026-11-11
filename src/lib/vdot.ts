import type { GoalKind, Zone } from "./types";

// Jack Daniels' oxygen cost and drop-dead formulas. Velocity in m/min, time in minutes.
function oxygenCost(velocity: number): number {
  return -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
}

function fractionSustainable(minutes: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * minutes) + 0.2989558 * Math.exp(-0.1932605 * minutes);
}

function velocityForOxygen(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** VDOT from a race or time-trial result. */
export function vdotFromPerformance(distanceMeters: number, seconds: number): number {
  const minutes = seconds / 60;
  const velocity = distanceMeters / minutes;
  return oxygenCost(velocity) / fractionSustainable(minutes);
}

/** Predicted race time in seconds for a distance at a given VDOT. */
export function predictRaceTime(vdot: number, distanceMeters: number): number {
  let lo = distanceMeters / 10; // 10 m/s is faster than any human race
  let hi = distanceMeters * 2; // 0.5 m/s is slower than walking
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (vdotFromPerformance(distanceMeters, mid) > vdot) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Seconds per kilometre when running at `fraction` of VDOT. */
export function paceAtFraction(vdot: number, fraction: number): number {
  const velocity = velocityForOxygen(vdot * fraction);
  return 60_000 / velocity;
}

const ZONE_FRACTIONS: Record<Exclude<Zone, "race">, [number, number]> = {
  easy: [0.62, 0.7],
  long: [0.63, 0.72],
  marathon: [0.79, 0.82],
  threshold: [0.86, 0.89],
  interval: [0.96, 0.99],
  repetition: [1.04, 1.08],
};

export const GOAL_DISTANCE: Record<Exclude<GoalKind, "fitness">, number> = {
  "5k": 5000,
  "10k": 10000,
  half: 21097.5,
  marathon: 42195,
};

export interface PaceRange {
  /** Faster bound, seconds per km. */
  fast: number;
  /** Slower bound, seconds per km. */
  slow: number;
}

/** Target pace band for a zone. Race pace is the predicted pace for the goal distance, plus or minus 1.5%. */
export function zonePace(vdot: number, zone: Zone, goal: GoalKind = "10k"): PaceRange {
  if (zone === "race") {
    const distance = goal === "fitness" ? 10000 : GOAL_DISTANCE[goal];
    const pace = predictRaceTime(vdot, distance) / (distance / 1000);
    return { fast: pace * 0.985, slow: pace * 1.015 };
  }
  const [low, high] = ZONE_FRACTIONS[zone];
  return { fast: paceAtFraction(vdot, high), slow: paceAtFraction(vdot, low) };
}

export function zoneMidPace(vdot: number, zone: Zone, goal?: GoalKind): number {
  const range = zonePace(vdot, zone, goal);
  return (range.fast + range.slow) / 2;
}

/** Starting fitness for runners without a recent result. */
export const LEVEL_VDOT = {
  new: 28,
  casual: 34,
  regular: 41,
} as const;

export const LEVEL_WEEKLY_KM = {
  new: 8,
  casual: 15,
  regular: 30,
} as const;

export function clampVdot(vdot: number): number {
  return Math.min(85, Math.max(20, vdot));
}
