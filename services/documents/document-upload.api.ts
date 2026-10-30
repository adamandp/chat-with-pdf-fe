import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { PdfDocument, WebResponse } from "@/features/common/types";

/** Based on the actual NestJS documents controller:
 * POST /documents/presigned-url → PUT upload_url → POST /documents/:id/process
 * → GET /documents/:id until READY. Do not send chat while indexing.
 */
export type UploadStage = "preparing" | "uploading" | "processing";
export type DocumentUploadInput = { file: File; onStage?: (stage: UploadStage) => void };
type PresignResponse = { document_id: string; upload_url: string; expires_in: number };
type RawUploadedDocument = Partial<PdfDocument> & {
  id: string; status?: PdfDocument["status"]; fileName?: string | null;
  fileSize?: string | null; pageCount?: number | null; download_url?: string;
};

const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function toDocument(raw: RawUploadedDocument, fallback: File): PdfDocument {
  return {
    id: raw.id,
    name: raw.name ?? raw.fileName ?? fallback.name,
    description: raw.description ?? "Uploaded PDF document",
    pages: raw.pages ?? raw.pageCount ?? 1,
    size: raw.size ?? (raw.fileSize ? `${(Number(raw.fileSize) / 1048576).toFixed(2)} MB` : `${(fallback.size / 1048576).toFixed(2)} MB`),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    deletedAt: raw.deletedAt ?? null,
    accent: raw.accent ?? "blue",
    analyzed: raw.analyzed ?? raw.status === "READY",
    status: raw.status,
    url: raw.url ?? raw.download_url,
  };
}

export async function uploadDocument({ file, onStage }: DocumentUploadInput): Promise<PdfDocument> {
  onStage?.("preparing");
  // The current backend accepts fileName only. Do not send fields that its DTO rejects.
  const { data: presigned } = await axiosInstance.post<WebResponse<PresignResponse>>(
    "/documents/presigned-url", { fileName: file.name },
  );
  const { document_id, upload_url } = presigned.data;

  onStage?.("uploading");
  // Signed URLs must bypass the app Axios baseURL and auth interceptors.
  await axios.put(upload_url, file, {
    headers: { "Content-Type": "application/pdf" },
    timeout: 90_000,
  });

  onStage?.("processing");
  await axiosInstance.post(`/documents/${document_id}/process`);

  // The process endpoint only queues a job; successful enqueue is not READY.
  // Poll the authoritative status so chat never searches unfinished embeddings.
  for (let attempt = 0; attempt < 60; attempt++) {
    const { data } = await axiosInstance.get<WebResponse<RawUploadedDocument>>(`/documents/${document_id}`);
    const document = data.data;
    if (document.status === "READY") return toDocument(document, file);
    if (document.status === "FAILED") throw new Error("PDF processing failed");
    await sleep(2_000);
  }
  throw new Error("Document is still processing. Please try again when it is ready.");
}
