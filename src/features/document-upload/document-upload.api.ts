import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";

/** Based on the NestJS document-upload controller:
 * POST /document-upload/presigned-url → PUT upload_url → POST /document-upload/:id/process
 * Processing is tracked separately so an unfinished worker is never reported as an upload failure.
 */
export type UploadStage = "preparing" | "uploading" | "processing";
export type DocumentUploadInput = { file: File; onStage?: (stage: UploadStage) => void };
type PresignResponse = { document_id: string; upload_url: string; expires_in: number };
export type QueuedUpload = { id: string; name: string };

export async function uploadDocument({
  file,
  onStage,
}: DocumentUploadInput): Promise<QueuedUpload> {
  onStage?.("preparing");
  // The PUT and enqueue must succeed before tracking processing in the background.
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
  return { id: document_id, name: file.name };
}
