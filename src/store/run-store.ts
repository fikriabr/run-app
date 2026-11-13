import { AppState } from "react-native";
import { create } from "zustand";
import { createRun, type RunEvent, runReducer, type RunSetup, type RunState, suspendRun } from "@/lib/run-engine";
import { persistStorage } from "./storage";

export interface GpsStatus {
  permission: "unknown" | "granted" | "denied";
  background: boolean;
  accuracy: number | null;
  /** "servicesOff" when location services are disabled on the phone, otherwise a raw error message. */
  error: string | null;
}

interface RunStore {
  run: RunState | null;
  workoutId: string | null;
  gps: GpsStatus;
  /** True when this run came back from a snapshot after the app was closed or killed. */
  restored: boolean;
  begin: (setup: RunSetup, workoutId: string | null) => void;
  dispatch: (event: RunEvent) => void;
  setGps: (patch: Partial<GpsStatus>) => void;
  clear: () => void;
}

const INITIAL_GPS: GpsStatus = { permission: "unknown", background: false, accuracy: null, error: null };

// Android vendors kill background apps aggressively; without this a long run can vanish mid-recording.
const SNAPSHOT_KEY = "langkah-active-run";
const SNAPSHOT_EVERY_MS = 15_000;

interface Snapshot {
  savedAt: number;
  workoutId: string | null;
  run: RunState;
}

function readSnapshot(): Snapshot | null {
  try {
    const raw = persistStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as Snapshot;
    return snap?.run && snap.run.status !== "ready" ? snap : null;
  } catch {
    return null;
  }
}

function writeSnapshot(run: RunState | null, workoutId: string | null) {
  try {
    if (!run || run.status === "ready") persistStorage.removeItem(SNAPSHOT_KEY);
    else persistStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ savedAt: Date.now(), workoutId, run } satisfies Snapshot));
  } catch {
    // Storage full or unavailable: the live recording carries on, only crash recovery is lost.
  }
}

const snapshot = readSnapshot();

export const useRunStore = create<RunStore>()((set) => ({
  run: snapshot ? suspendRun(snapshot.run, snapshot.savedAt) : null,
  workoutId: snapshot?.workoutId ?? null,
  gps: INITIAL_GPS,
  restored: snapshot != null,
  begin: (setup, workoutId) => set({ run: createRun(setup), workoutId, restored: false }),
  dispatch: (event) => set((s) => (s.run ? { run: runReducer(s.run, event) } : {})),
  setGps: (patch) => set((s) => ({ gps: { ...s.gps, ...patch } })),
  clear: () => set({ run: null, workoutId: null, gps: INITIAL_GPS, restored: false }),
}));

let lastSaved = 0;
useRunStore.subscribe((state, prev) => {
  const statusChanged = state.run?.status !== prev.run?.status;
  const now = Date.now();
  if (!state.run || statusChanged || now - lastSaved >= SNAPSHOT_EVERY_MS) {
    lastSaved = now;
    writeSnapshot(state.run, state.workoutId);
  }
});

AppState.addEventListener("change", (next) => {
  if (next !== "active") {
    const { run, workoutId } = useRunStore.getState();
    if (run) writeSnapshot(run, workoutId);
  }
});
