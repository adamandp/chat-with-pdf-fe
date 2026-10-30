"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSession, renameSession, restoreSession } from "./session.api";
import { sessionKeys } from "./session.query";

export function useRenameSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameSession(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) => deleteSession(id, permanent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}

export function useRestoreSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}
