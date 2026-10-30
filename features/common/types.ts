export interface Paging { currentPage: number; pageSize: number; totalItems: number; totalPages: number }
export interface WebResponse<T> { data: T; paging?: Paging; message?: string }
export type Accent = "pink" | "blue" | "mint" | "purple" | "yellow";
export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  documentIds: string[];
  forkedFromSessionId?: string;
  forkedFromMessageId?: string;
}
export interface PdfDocument {
  id: string;
  name: string;
  description: string;
  pages: number;
  size: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  analyzed: boolean;
  status?: "PENDING_UPLOAD" | "QUEUED" | "PROCESSING" | "READY" | "FAILED";
  accent: Accent;
  url?: string;
}
export interface Source { documentId: string; page: number }
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
export interface ChatResponse { session: Session; messages: ChatMessage[] }
export type AnswerMode = "document" | "general";
export type ThinkingMode = "quick" | "pro" | "ultra";
