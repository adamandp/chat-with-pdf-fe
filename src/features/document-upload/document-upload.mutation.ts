"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "@/features/document/document.query";
import { uploadDocument, type DocumentUploadInput } from "./document-upload.api";
import { useAuth } from "@/providers/auth-provider";

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { ensureSession } = useAuth();
  return useMutation({
    mutationFn: async (input: DocumentUploadInput) => {
      await ensureSession();
      return uploadDocument(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
