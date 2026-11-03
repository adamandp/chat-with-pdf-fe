"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, restoreDocument } from "./document.api";
import { documentKeys } from "./document.query";
import { forgetUploadedFile } from "@/lib/uploaded-files";

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, permanent }: { id: string; permanent: boolean }) => {
      await deleteDocument(id, permanent);
      if (permanent && process.env.NEXT_PUBLIC_API_MOCKING !== "disabled") {
        await forgetUploadedFile(id).catch(() => {});
      }
    },
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
