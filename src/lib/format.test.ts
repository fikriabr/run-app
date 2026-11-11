import { describe, expect, it } from "vitest";
import { formatDistance, formatDuration, formatPace, parseDuration } from "./format";

describe("format", () => {
  it("formats paces in both units", () => {
    expect(formatPace(300, "km")).toBe("5:00");
    expect(formatPace(300, "mi")).toBe("8:03");
    expect(formatPace(299.6, "km")).toBe("5:00");
    expect(formatPace(null, "km")).toBe("-:--");
    expect(formatPace(Infinity, "km")).toBe("-:--");
  });

  it("formats durations", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("formats distance", () => {
    expect(formatDistance(5000, "km")).toBe("5.00");
    expect(formatDistance(1609.344, "mi", 1)).toBe("1.0");
  });

  it("parses durations and rejects junk", () => {
    expect(parseDuration("25:30")).toBe(1530);
    expect(parseDuration("1:45:00")).toBe(6300);
    expect(parseDuration("25:75")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("0:00")).toBeNull();
  });
});
