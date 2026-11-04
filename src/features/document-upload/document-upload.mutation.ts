"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "@/features/document/document.query";
import { uploadDocument, type DocumentUploadInput } from "./document-upload.api";
import { rememberPendingUpload } from "./pending-uploads";
import { getProfile } from "@/features/auth/auth.api";
import { rememberUploadedFile } from "@/lib/uploaded-files";
import { useAuth } from "@/providers/auth-provider";

export type ScopedUploadInput = DocumentUploadInput & { scope: string };

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { ensureSession } = useAuth();
  return useMutation({
    mutationFn: async (input: ScopedUploadInput) => {
      await ensureSession();
      // Resolve the actual session owner, including a guest created by ensureSession().
      const owner = await getProfile();
      const queued = await uploadDocument(input);
      rememberPendingUpload(owner.id, {
        ...queued,
        scope: input.scope,
        queuedAt: Date.now(),
      });
      rememberUploadedFile(queued.id, input.file);
      return queued;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
