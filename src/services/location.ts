import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import type { Fix } from "@/lib/geo";
import { useRunStore } from "@/store/run-store";

export const LOCATION_TASK = "langkah-run-location";
const isWeb = process.env.EXPO_OS === "web";

function handleLocations(locations: Location.LocationObject[]) {
  const { dispatch, setGps } = useRunStore.getState();
  for (const loc of locations) {
    const fix: Fix = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude ?? null,
      accuracy: loc.coords.accuracy ?? null,
      timestamp: loc.timestamp,
    };
    setGps({ accuracy: fix.accuracy });
    dispatch({ type: "fix", fix });
  }
}

// Must run at module load so the OS can deliver locations while the app is in the background.
if (!isWeb && !TaskManager.isTaskDefined(LOCATION_TASK)) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      useRunStore.getState().setGps({ error: error.message });
      return;
    }
    if (data?.locations) handleLocations(data.locations);
  });
}

let watcher: Location.LocationSubscription | null = null;

export async function requestPermission(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  const granted = fg.status === "granted";
  useRunStore.getState().setGps({ permission: granted ? "granted" : "denied" });
  return granted;
}

export async function checkPermission(): Promise<boolean> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status === "granted") {
    useRunStore.getState().setGps({ permission: "granted" });
    return true;
  }
  if (fg.status === "denied" && !fg.canAskAgain) useRunStore.getState().setGps({ permission: "denied" });
  return false;
}

/**
 * Starts delivering fixes to the run store. Uses the background task when "Always" access is
 * granted so recording survives a locked screen; otherwise falls back to a foreground watcher.
 */
export async function startTracking(notification: { title: string; body: string; color: string }): Promise<void> {
  await stopTracking();
  const { setGps } = useRunStore.getState();
  const options: Location.LocationOptions = {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 0,
  };

  if (!isWeb) {
    try {
      let bg = await Location.getBackgroundPermissionsAsync();
      if (bg.status !== "granted" && bg.canAskAgain) bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status === "granted") {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, {
          ...options,
          activityType: Location.ActivityType.Fitness,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: notification.title,
            notificationBody: notification.body,
            notificationColor: notification.color,
            killServiceOnDestroy: true,
          },
        });
        setGps({ background: true, error: null });
        return;
      }
    } catch (e) {
      setGps({ error: e instanceof Error ? e.message : String(e) });
    }
  }

  watcher = await Location.watchPositionAsync(options, (loc) => handleLocations([loc]));
  setGps({ background: false });
}

export async function stopTracking(): Promise<void> {
  watcher?.remove();
  watcher = null;
  if (isWeb) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    // Not started or already stopped by the OS: nothing to clean up.
  }
}
