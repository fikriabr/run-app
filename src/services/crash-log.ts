import "expo-sqlite/localStorage/install";

export interface CrashReport {
  at: number;
  message: string;
  stack: string | null;
  fatal: boolean;
}

const KEY = "langkah-last-crash";

/** Keeps the last uncaught error so the runner can see and share it after the app restarts. */
export function recordCrash(error: unknown, fatal: boolean): void {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const report: CrashReport = { at: Date.now(), message: `${err.name}: ${err.message}`, stack: err.stack?.slice(0, 4000) ?? null, fatal };
    localStorage.setItem(KEY, JSON.stringify(report));
  } catch {
    // Never let crash logging throw on top of the original error.
  }
}

export function readLastCrash(): CrashReport | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CrashReport) : null;
  } catch {
    return null;
  }
}

export function clearLastCrash(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

type Handler = (error: unknown, isFatal?: boolean) => void;
const errorUtils = (globalThis as { ErrorUtils?: { getGlobalHandler: () => Handler; setGlobalHandler: (h: Handler) => void } }).ErrorUtils;
// Native only: the web build loads routes in chunks, and Metro reports the expected first miss
// ("Requiring unknown module") through this handler before loading the chunk, which is not a crash.
if (errorUtils && process.env.EXPO_OS !== "web") {
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    recordCrash(error, Boolean(isFatal));
    previous(error, isFatal);
  });
}
