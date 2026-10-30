import type { ChatMessage, PdfDocument, Session } from "@/features/common/types";
import { documents, deletedDocuments } from "./documents";
import { sessions, deletedSessions } from "./sessions";
import { messages } from "./messages";

/** Worker-memory demo data; mutations reset after the service worker stops. */
export const store: { sessions: Session[]; documents: PdfDocument[]; messages: ChatMessage[]; uploadRecords: Map<string, { uploaded: boolean; processingAt: number | null }> } = {
  sessions: [...sessions, ...deletedSessions],
  documents: [...documents, ...deletedDocuments],
  messages: [...messages],
  uploadRecords: new Map<string, { uploaded: boolean; processingAt: number | null }>(),
};

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const size = Math.min(50, Math.max(1, pageSize || 6));
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.min(totalPages, Math.max(1, page || 1));
  return {
    data: items.slice((currentPage - 1) * size, currentPage * size),
    paging: { currentPage, pageSize: size, totalItems: items.length, totalPages },
  };
}
