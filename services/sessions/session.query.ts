"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession, getSessions } from "./session.api";

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
