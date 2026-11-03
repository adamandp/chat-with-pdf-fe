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
}

export interface ChatResponse {
  session: Session;
  messages: ChatMessage[];
}

export type AnswerMode = "document" | "general";
export type ThinkingMode = "quick" | "pro" | "ultra";
