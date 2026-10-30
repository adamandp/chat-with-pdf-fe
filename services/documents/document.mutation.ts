"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, restoreDocument, uploadDocument } from "./document.api";
import { documentKeys } from "./document.query";

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) => deleteDocument(id, permanent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useRestoreDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
