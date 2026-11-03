"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "@/features/document/document.query";
import { uploadDocument, type DocumentUploadInput } from "./document-upload.api";

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DocumentUploadInput) => uploadDocument(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
