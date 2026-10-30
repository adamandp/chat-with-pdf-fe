"use client";

import { useSyncExternalStore } from "react";

const KEY = "chat-with-pdf:drafts:v1";
const EMPTY: Readonly<Record<string, string>> = Object.freeze({});
let current: Readonly<Record<string, string>> = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const draftKey = (id?: string) => id || "new";

function parseDrafts(raw: string | null): Readonly<Record<string, string>> {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY;
    return Object.fromEntries(
      Object.entries(value).filter(([key, text]) => key.length < 150 && typeof text === "string" && text.length < 100_000),
    ) as Record<string, string>;
  } catch {
    return EMPTY;
  }
}

function read(): Readonly<Record<string, string>> {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try { current = parseDrafts(window.localStorage.getItem(KEY)); } catch { current = EMPTY; }
  }
  return current;
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
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storage);
  };
}

/** A single snapshot shared by the composer and sidebar; safe for Next.js SSR. */
export function useChatDrafts() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function getChatDraft(id?: string) {
  return read()[draftKey(id)] ?? "";
}

export function setChatDraft(id: string | undefined, text: string) {
  const next: Record<string, string> = { ...read() };
  if (text.length) next[draftKey(id)] = text;
  else delete next[draftKey(id)];
  current = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* browser storage disabled */ }
  notify();
}

export function moveChatDraft(from: string | undefined, to: string) {
  const text = getChatDraft(from);
  setChatDraft(to, text);
  setChatDraft(from, "");
}

export function useSessionDraft(id?: string): [string, (text: string) => void] {
  const snapshots = useChatDrafts();
  return [snapshots[draftKey(id)] ?? "", (text) => setChatDraft(id, text)];
}
