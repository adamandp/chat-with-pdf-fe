import { axiosInstance } from "@/lib/axios";
import type { Accent, PdfDocument } from "@/interface/document.interface";
import type { WebResponse } from "@/interface/common.interface";

export interface RawDocument {
  id: string;
  fileName: string | null;
  fileSize: string | null;
  pageCount: number | null;
  status: PdfDocument["status"];
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  download_url?: string;
  // Mock fixtures may supply a local PDF for the standalone demo.
  url?: string;
}

const accents: Accent[] = ["pink", "blue", "mint", "purple", "yellow"];

export function toPdfDocument(raw: RawDocument): PdfDocument {
  const value = [...raw.id].reduce((result, char) => result + char.charCodeAt(0), 0);
  const bytes = Number(raw.fileSize || 0);
  return {
    id: raw.id,
    name: raw.fileName || "Untitled PDF",
    description: "PDF document",
    pages: raw.pageCount || 1,
    size: bytes ? `${(bytes / 1048576).toFixed(2)} MB` : "Unknown size",
    createdAt: raw.createdAt || new Date(0).toISOString(),
    updatedAt: raw.updatedAt || new Date(0).toISOString(),
    deletedAt: raw.deletedAt,
    analyzed: raw.status === "READY",
    status: raw.status,
    accent: accents[value % accents.length],
    url: raw.download_url || raw.url,
  };
}

export interface DocumentFilters {
  deleted?: boolean;
  q?: string;
  sort?: "modified" | "name" | "pages";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getDocuments(filters: DocumentFilters): Promise<WebResponse<PdfDocument[]>> {
  const { deleted, page = 1, pageSize = 10, q, direction, sort } = filters;
  const { data } = await axiosInstance.get<WebResponse<RawDocument[]>>(
    deleted ? "/documents/deleted" : "/documents",
    {
      params: {
        page,
        limit: pageSize,
        ...(q ? { q } : {}),
        ...(direction ? { order: direction } : {}),
        ...(sort ? { sort } : {}),
      },
    },
  );
  return { ...data, data: (data.data || []).map(toPdfDocument) };
}

export async function getDocument(id: string): Promise<PdfDocument> {
  const { data } = await axiosInstance.get<WebResponse<RawDocument>>(`/documents/${id}`);
  return toPdfDocument(data.data);
}

export async function deleteDocument(id: string, permanent: boolean) {
  await axiosInstance.delete(`/documents/${id}${permanent ? "/permanent" : ""}`);
}

export async function restoreDocument(id: string) {
  const { data } = await axiosInstance.post<WebResponse<RawDocument>>(`/documents/${id}/restore`);
  return data.data;
}
