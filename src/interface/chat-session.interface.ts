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
