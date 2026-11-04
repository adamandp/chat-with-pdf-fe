"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, restoreDocument } from "./document.api";
import { documentKeys } from "./document.query";
import { chatKeys } from "@/features/chat/chat.query";
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
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: chatKeys.all }),
      ]),
  });
}

export function useRestoreDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreDocument,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: chatKeys.all }),
      ]),
  });
}
