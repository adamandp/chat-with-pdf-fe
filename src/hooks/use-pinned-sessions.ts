"use client";

import { useSyncExternalStore } from "react";

const KEY = "chat-with-pdf:pinned:v1";
const DEFAULT_IDS: readonly string[] = Object.freeze(["session-2"]);
let pinned: readonly string[] = DEFAULT_IDS;
let loaded = false;
const listeners = new Set<() => void>();

function parseIds(raw: string | null): readonly string[] {
  try {
    if (raw === null) return DEFAULT_IDS;
    const ids: unknown = JSON.parse(raw);
    if (!Array.isArray(ids)) return DEFAULT_IDS;
    return [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length < 150))];
  } catch { return DEFAULT_IDS; }
}
function read(): readonly string[] {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try { pinned = parseIds(window.localStorage.getItem(KEY)); } catch { pinned = DEFAULT_IDS; }
  }
  return pinned;
}
function notify() { for (const listener of listeners) listener(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    loaded = false;
    read();
    notify();
  };
  window.addEventListener("storage", storage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", storage); };
}
export function usePinnedSessions() {
  const ids = useSyncExternalStore(subscribe, read, () => DEFAULT_IDS);
  return { pinnedIds: ids, togglePinned(id: string) {
    const next = read().includes(id) ? read().filter((item) => item !== id) : [...read(), id];
    pinned = next;
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private browsing */ }
    notify();
  } };
}
