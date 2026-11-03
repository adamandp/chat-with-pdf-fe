import type { Session } from "./chat-session.interface";

export interface Source {
  documentId: string;
  page: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources: Source[];
  feedback?: "up" | "down";
  regenerationCount?: number;
  status?: "pending" | "streaming" | "completed" | "failed" | "cancelled";
  parentMessageId?: string | null;
  versionGroupId?: string;
  versionCount?: number;
  versions?: { id: string; active: boolean; status: string; createdAt: string | null }[];
}

export interface ChatResponse {
  session: Session;
  messages: ChatMessage[];
  documents: import("./document.interface").PdfDocument[];
}

export type AnswerMode = "document" | "general";
export type ThinkingMode = "quick" | "pro" | "ultra";
