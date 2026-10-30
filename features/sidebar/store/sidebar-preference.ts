"use client";
import { useSyncExternalStore } from "react";

const KEY = "chat-with-pdf:sidebar-collapsed";
let snapshot = false;
let loaded = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try { snapshot = window.localStorage.getItem(KEY) === "true"; } catch { snapshot = false; }
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    loaded = false;
    getSnapshot();
    listeners.forEach(fn => fn());
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
export function toggleSidebarCollapsed() {
  snapshot = !getSnapshot();
  try { window.localStorage.setItem(KEY, String(snapshot)); } catch { /* storage unavailable */ }
  listeners.forEach(fn => fn());
}
