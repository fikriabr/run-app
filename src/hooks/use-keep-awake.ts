import { useKeepAwake } from "expo-keep-awake";

/** Keeps the screen on during a run so the runner can glance at it. */
export function useRunKeepAwake() {
  useKeepAwake();
}
