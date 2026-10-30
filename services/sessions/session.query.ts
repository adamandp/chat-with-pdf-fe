"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSession, getSession, getSessions, renameSession, restoreSession } from "./session.api";

export const sessionKeys = {
  all: ["sessions"] as const,
  list: (deleted: boolean, q: string) => ["sessions", "list", deleted, q] as const,
  detail: (id: string) => ["sessions", "detail", id] as const,
};
export function useSessions(deleted = false, q = "") {
  return useQuery({ queryKey: sessionKeys.list(deleted, q), queryFn: () => getSessions(deleted, q) });
}
export function useSession(id?: string) {
  return useQuery({ queryKey: sessionKeys.detail(id || ""), queryFn: () => getSession(id!), enabled: Boolean(id) });
}
export function useRenameSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, title }: { id: string; title: string }) => renameSession(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }) });
}
export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) => deleteSession(id, permanent),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }) });
}
export function useRestoreSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: restoreSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }) });
}
