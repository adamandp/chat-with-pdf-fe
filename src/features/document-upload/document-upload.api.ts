import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { PdfDocument } from "@/interface/document.interface";
import type { WebResponse } from "@/interface/common.interface";
import { getDocument } from "@/features/document/document.api";

/** Based on the NestJS document-upload controller:
 * POST /document-upload/presigned-url → PUT upload_url → POST /document-upload/:id/process
 * → GET /documents/:id until READY. Do not send chat while indexing.
 */
export type UploadStage = "preparing" | "uploading" | "processing";
export type DocumentUploadInput = { file: File; onStage?: (stage: UploadStage) => void };
type PresignResponse = { document_id: string; upload_url: string; expires_in: number };
type RawUploadedDocument = { status?: PdfDocument["status"] };

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function uploadDocument({ file, onStage }: DocumentUploadInput): Promise<PdfDocument> {
  onStage?.("preparing");
  // Presign, PUT, queue processing, then poll for an authoritative READY status.
  const { data: presigned } = await axiosInstance.post<WebResponse<PresignResponse>>(
    "/document-upload/presigned-url",
    { fileName: file.name },
  );
  const { document_id, upload_url } = presigned.data;

  onStage?.("uploading");
  // Signed URLs must bypass the app Axios baseURL and auth interceptors.
  await axios.put(upload_url, file, {
    headers: { "Content-Type": "application/pdf" },
    timeout: 90_000,
  });

  onStage?.("processing");
  await axiosInstance.post(`/document-upload/${document_id}/process`);

  // The process endpoint only queues a job; successful enqueue is not READY.
  // Poll the authoritative status so chat never searches unfinished embeddings.
  for (let attempt = 0; attempt < 60; attempt++) {
    const { data } = await axiosInstance.get<WebResponse<RawUploadedDocument>>(
      `/documents/${document_id}`,
    );
    const document = data.data;
    if (document.status === "READY") return getDocument(document_id);
    if (document.status === "FAILED") throw new Error("PDF processing failed");
    await sleep(2_000);
  }
  throw new Error("Document is still processing. Please try again when it is ready.");
}
