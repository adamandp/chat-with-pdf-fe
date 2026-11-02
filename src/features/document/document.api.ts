import { axiosInstance } from "@/lib/axios";
import type { PdfDocument } from "@/interface/document.interface";
import type { WebResponse } from "@/interface/common.interface";

export interface DocumentFilters {
  deleted?: boolean;
  q?: string;
  sort?: "modified" | "name" | "pages";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
export async function getDocuments(filters: DocumentFilters) {
  const { data } = await axiosInstance.get<WebResponse<PdfDocument[]>>("/documents", {
    params: filters,
  });
  return data;
}
export async function deleteDocument(id: string, permanent: boolean) {
  await axiosInstance.delete(`/documents/${id}`, { params: { permanent } });
}
export async function restoreDocument(id: string) {
  const { data } = await axiosInstance.post<WebResponse<PdfDocument>>(`/documents/${id}/restore`);
  return data.data;
}
