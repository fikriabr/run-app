const EARTH_RADIUS = 6_371_000;

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface Fix {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
}

/** Fixes worse than this are dropped: urban canyons routinely report 50 m+ when the signal is poor. */
export const MAX_ACCURACY = 25;
/** Faster than any runner; anything above is a GPS jump. */
export const MAX_SPEED = 11;
/** Movement below this is treated as jitter while standing still. */
export const MIN_STEP = 2.5;

export type FixVerdict = { accept: false } | { accept: true; distance: number };

/** Decides whether a new fix adds distance, relative to the last accepted fix. */
export function judgeFix(previous: Fix | null, next: Fix): FixVerdict {
  if (next.accuracy != null && next.accuracy > MAX_ACCURACY) return { accept: false };
  if (!previous) return { accept: true, distance: 0 };
  const distance = haversine(previous.latitude, previous.longitude, next.latitude, next.longitude);
  const seconds = (next.timestamp - previous.timestamp) / 1000;
  if (seconds <= 0) return { accept: false };
  if (distance / seconds > MAX_SPEED) return { accept: false };
  if (distance < MIN_STEP) return { accept: false };
  return { accept: true, distance };
}

/** Elevation gain with a 3 m dead band so barometric and GPS noise does not add up to fake climbing. */
export function elevationGain(altitudes: (number | null)[]): number {
  let gain = 0;
  let anchor: number | null = null;
  for (const alt of altitudes) {
    if (alt == null) continue;
    if (anchor == null) {
      anchor = alt;
      continue;
    }
    if (alt - anchor >= 3) {
      gain += alt - anchor;
      anchor = alt;
    } else if (anchor - alt >= 3) {
      anchor = alt;
    }
  }
  return gain;
}
