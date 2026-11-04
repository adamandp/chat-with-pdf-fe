export interface Session {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt: string;
  deletedAt: string | null;
  documentIds: string[];
  isPinned: boolean;
  answerMode?: "general" | "document_only";
  activeLeafMessageId?: string | null;
  forkedFromSessionId?: string;
  forkedFromMessageId?: string;
}
