import "expo-sqlite/localStorage/install";
import type { RoutePoint } from "@/lib/types";

// Routes live outside the main store so opening the app never parses every GPS point ever recorded.
const routeKey = (id: string) => `route:${id}`;

export function saveRoute(id: string, points: RoutePoint[]): void {
  localStorage.setItem(routeKey(id), JSON.stringify(points));
}

export function loadRoute(id: string): RoutePoint[] {
  const raw = localStorage.getItem(routeKey(id));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RoutePoint[];
  } catch {
    return [];
  }
}

export function deleteRoute(id: string): void {
  localStorage.removeItem(routeKey(id));
}

export function clearAllStorage(): void {
  localStorage.clear();
}

export const persistStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};
