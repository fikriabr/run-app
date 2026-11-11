/** Local-date helpers working on YYYY-MM-DD strings, so plans never shift with time zones. */

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** 0 = Monday ... 6 = Sunday. */
export function weekday(key: string): number {
  return (fromDateKey(key).getDay() + 6) % 7;
}

export function mondayOf(key: string): string {
  return addDays(key, -weekday(key));
}

export function daysBetween(fromKey: string, toKey: string): number {
  const ms = fromDateKey(toKey).getTime() - fromDateKey(fromKey).getTime();
  return Math.round(ms / 86_400_000);
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}
