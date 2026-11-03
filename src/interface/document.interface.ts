export type Accent = "pink" | "blue" | "mint" | "purple" | "yellow";

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
