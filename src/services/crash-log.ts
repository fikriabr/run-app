import { Alert, Share } from "react-native";

// No native storage import here: this file must install its handler even if a native module fails to
// load. It writes through the global localStorage that src/store/storage.ts installs, when present.
const store = () => (globalThis as { localStorage?: Storage }).localStorage;

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
    store()?.setItem(KEY, JSON.stringify(report));
  } catch {
    // Never let crash logging throw on top of the original error.
  }
}

export function readLastCrash(): CrashReport | null {
  try {
    const raw = store()?.getItem(KEY);
    return raw ? (JSON.parse(raw) as CrashReport) : null;
  } catch {
    return null;
  }
}

export function clearLastCrash(): void {
  try {
    store()?.removeItem(KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

type Handler = (error: unknown, isFatal?: boolean) => void;
const errorUtils = (globalThis as { ErrorUtils?: { getGlobalHandler: () => Handler; setGlobalHandler: (h: Handler) => void } }).ErrorUtils;

/**
 * In release builds a fatal JavaScript error closes the app at once, so an error during startup
 * is never seen. Show it in a native dialog first, with a way to share it, then close as before.
 */
function showFatal(error: unknown, close: () => void) {
  const err = error instanceof Error ? error : new Error(String(error));
  const details = `${err.name}: ${err.message}\n\n${err.stack ?? ""}`.slice(0, 3000);
  try {
    Alert.alert(
      "Langkah error",
      `${err.name}: ${err.message}`.slice(0, 600),
      [
        { text: "Share", onPress: () => void Share.share({ message: details }).finally(close) },
        { text: "Close", style: "cancel", onPress: close },
      ],
      { cancelable: false },
    );
  } catch {
    close();
  }
}

// Native only: the web build loads routes in chunks, and Metro reports the expected first miss
// ("Requiring unknown module") through this handler before loading the chunk, which is not a crash.
if (errorUtils && process.env.EXPO_OS !== "web") {
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    recordCrash(error, Boolean(isFatal));
    if (isFatal) showFatal(error, () => previous(error, isFatal));
    else previous(error, isFatal);
  });
}
