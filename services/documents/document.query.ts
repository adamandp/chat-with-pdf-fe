"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, getDocuments, restoreDocument, uploadDocument, type DocumentFilters } from "./document.api";

export const documentKeys = {
  all: ["documents"] as const,
  list: (filters: DocumentFilters) => ["documents", "list", filters] as const,
};
export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({ queryKey: documentKeys.list(filters), queryFn: () => getDocuments(filters) });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) => deleteDocument(id, permanent),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }) });
}
export function useRestoreDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: restoreDocument, onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }) });
}
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: uploadDocument, onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }) });
}
