import { create } from "zustand";
import { createRun, type RunEvent, runReducer, type RunSetup, type RunState } from "@/lib/run-engine";

export interface GpsStatus {
  permission: "unknown" | "granted" | "denied";
  background: boolean;
  accuracy: number | null;
  error: string | null;
}

interface RunStore {
  run: RunState | null;
  workoutId: string | null;
  gps: GpsStatus;
  begin: (setup: RunSetup, workoutId: string | null) => void;
  dispatch: (event: RunEvent) => void;
  setGps: (patch: Partial<GpsStatus>) => void;
  clear: () => void;
}

const INITIAL_GPS: GpsStatus = { permission: "unknown", background: false, accuracy: null, error: null };

export const useRunStore = create<RunStore>()((set) => ({
  run: null,
  workoutId: null,
  gps: INITIAL_GPS,
  begin: (setup, workoutId) => set({ run: createRun(setup), workoutId }),
  dispatch: (event) => set((s) => (s.run ? { run: runReducer(s.run, event) } : {})),
  setGps: (patch) => set((s) => ({ gps: { ...s.gps, ...patch } })),
  clear: () => set({ run: null, workoutId: null, gps: INITIAL_GPS }),
}));
