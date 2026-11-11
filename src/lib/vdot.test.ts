import { describe, expect, it } from "vitest";
import { paceAtFraction, predictRaceTime, vdotFromPerformance, zonePace } from "./vdot";

describe("vdot", () => {
  it("matches Daniels' published table within half a point", () => {
    // Daniels' Running Formula: 5K in 20:00 is VDOT ~49.8, 10K in 50:00 is ~40, marathon 3:00:00 is ~53.5.
    expect(vdotFromPerformance(5000, 20 * 60)).toBeCloseTo(49.8, 0);
    expect(vdotFromPerformance(10000, 50 * 60)).toBeCloseTo(40, 0);
    expect(vdotFromPerformance(42195, 3 * 3600)).toBeCloseTo(53.5, 0);
  });

  it("round-trips a race prediction", () => {
    const vdot = vdotFromPerformance(10000, 45 * 60);
    expect(predictRaceTime(vdot, 10000)).toBeCloseTo(45 * 60, 0);
    const half = predictRaceTime(vdot, 21097.5);
    expect(half).toBeGreaterThan(98 * 60);
    expect(half).toBeLessThan(102 * 60);
  });

  it("orders zones from slow to fast", () => {
    const easy = zonePace(45, "easy");
    const threshold = zonePace(45, "threshold");
    const interval = zonePace(45, "interval");
    expect(easy.fast).toBeLessThan(easy.slow);
    expect(threshold.slow).toBeLessThan(easy.fast);
    expect(interval.slow).toBeLessThan(threshold.fast);
    // VDOT 45 threshold is about 4:31 /km in Daniels' tables.
    expect(paceAtFraction(45, 0.88)).toBeGreaterThan(265);
    expect(paceAtFraction(45, 0.88)).toBeLessThan(280);
  });
});
