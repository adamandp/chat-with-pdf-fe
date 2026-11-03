import type { ChatMessage } from "@/interface/chat.interface";
import type { PdfDocument } from "@/interface/document.interface";
import type { Session } from "@/interface/chat-session.interface";
import { documents, deletedDocuments } from "./documents";
import { sessions, deletedSessions } from "./sessions";
import { messages } from "./messages";

const storageKey = "chat-with-pdf:demo-workspace:v2";

interface SavedStore {
  sessions: Session[];
  documents: PdfDocument[];
  messages: ChatMessage[];
}

function initialData(): SavedStore {
  if (typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const result = JSON.parse(saved) as SavedStore;
        if (
          Array.isArray(result.sessions) &&
          Array.isArray(result.documents) &&
          Array.isArray(result.messages)
        )
          return result;
      }
    } catch {
      // Corrupt demo data falls back to the bundled fixtures.
    }
  }
  return {
    sessions: [...sessions, ...deletedSessions],
    documents: [...documents, ...deletedDocuments],
    messages: [...messages],
  };
}

/** Mock state survives reloads and Vercel redeploys in the same browser. */
export const store: {
  sessions: Session[];
  documents: PdfDocument[];
  messages: ChatMessage[];
  uploadRecords: Map<string, { uploaded: boolean; processingAt: number | null }>;
} = {
  ...initialData(),
  uploadRecords: new Map<string, { uploaded: boolean; processingAt: number | null }>(),
};

export function persistStore() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        sessions: store.sessions,
        documents: store.documents,
        messages: store.messages,
      } satisfies SavedStore),
    );
  } catch {
    // Storage quotas/private browsing must not break the active demo session.
  }
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const size = Math.min(100, Math.max(1, pageSize || 10));
  const totalPages = Math.ceil(items.length / size);
  const currentPage = Math.max(1, page || 1);
  return {
    data: items.slice((currentPage - 1) * size, currentPage * size),
    paging: { currentPage, pageSize: size, totalItems: items.length, totalPages },
  };
}
