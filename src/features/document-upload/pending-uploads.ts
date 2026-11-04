/** Persist only server-queued documents. PDF bytes remain in MinIO, not browser storage. */
export interface PendingUpload {
  id: string;
  name: string;
  scope: string;
  queuedAt: number;
}

const prefix = "chat-with-pdf:pending-uploads:v1:";
const snapshots = new Map<string, PendingUpload[]>();
const listeners = new Set<() => void>();
export const EMPTY_PENDING_UPLOADS: PendingUpload[] = [];

export function pendingUploadsKey(userId: string) {
  return `${prefix}${userId}`;
}

export function getPendingUploads(userId: string): PendingUpload[] {
  if (!userId) return EMPTY_PENDING_UPLOADS;
  const snapshot = snapshots.get(userId);
  if (snapshot) return snapshot;
  try {
    if (typeof window === "undefined") return EMPTY_PENDING_UPLOADS;
    const stored = window.localStorage.getItem(pendingUploadsKey(userId));
    const parsed: unknown = JSON.parse(stored || "[]");
    if (!Array.isArray(parsed)) return EMPTY_PENDING_UPLOADS;
    const valid = parsed.filter(
      (item): item is PendingUpload =>
        !!item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.scope === "string" &&
        typeof item.queuedAt === "number",
    );
    snapshots.set(userId, valid);
    return valid;
  } catch {
    return EMPTY_PENDING_UPLOADS;
  }
}

function save(userId: string, uploads: PendingUpload[]) {
  snapshots.set(userId, uploads);
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem(pendingUploadsKey(userId), JSON.stringify(uploads));
  } catch {
    // Private browsing/storage quota: polling still works in the current tab.
  }
  for (const listener of listeners) listener();
}

export function subscribePendingUploads(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && !event.key.startsWith(prefix)) return;
    if (event.key === null) snapshots.clear();
    else snapshots.delete(event.key.slice(prefix.length));
    for (const subscriber of listeners) subscriber();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function rememberPendingUpload(userId: string, upload: PendingUpload) {
  save(userId, [...getPendingUploads(userId).filter((item) => item.id !== upload.id), upload]);
}

export function forgetPendingUploads(userId: string, ids: string[]) {
  const removed = new Set(ids);
  save(
    userId,
    getPendingUploads(userId).filter((item) => !removed.has(item.id)),
  );
}
