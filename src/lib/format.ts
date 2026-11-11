import type { Units } from "./types";

export const METERS_PER_MILE = 1609.344;

export function unitMeters(units: Units): number {
  return units === "km" ? 1000 : METERS_PER_MILE;
}

/** "12.34" in the chosen unit, no suffix. */
export function formatDistance(meters: number, units: Units, digits = 2): string {
  return (meters / unitMeters(units)).toFixed(digits);
}

/** "4:05" per unit from seconds per km. Returns "-:--" for missing or absurd paces. */
export function formatPace(secondsPerKm: number | null | undefined, units: Units): string {
  if (secondsPerKm == null || !Number.isFinite(secondsPerKm) || secondsPerKm <= 0 || secondsPerKm > 3600) {
    return "-:--";
  }
  const perUnit = units === "km" ? secondsPerKm : secondsPerKm * (METERS_PER_MILE / 1000);
  let minutes = Math.floor(perUnit / 60);
  let seconds = Math.round(perUnit % 60);
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "45:07" or "1:45:07". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** Rough "45 min" / "1 h 20 min" for plans, where seconds would be false precision. */
export function formatMinutes(totalSeconds: number): { h: number; m: number } {
  const minutes = Math.round(totalSeconds / 60);
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}

/** Parses "mm:ss" or "h:mm:ss" into seconds; null when malformed. */
export function parseDuration(text: string): number | null {
  const parts = text.trim().split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.slice(1).some((n) => n >= 60)) return null;
  const seconds = nums.length === 3 ? nums[0] * 3600 + nums[1] * 60 + nums[2] : nums[0] * 60 + nums[1];
  return seconds > 0 ? seconds : null;
}
