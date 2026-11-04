"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocument, getDocuments, type DocumentFilters } from "./document.api";
import { useAuth } from "@/providers/auth-provider";

export const documentKeys = {
  all: ["documents"] as const,
  list: (filters: DocumentFilters) => ["documents", "list", filters] as const,
  detail: (id: string) => ["documents", "detail", id] as const,
};

export function useDocuments(filters: DocumentFilters = {}) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => getDocuments(filters),
    enabled: !loading && Boolean(user),
  });
}

export function useDocument(id?: string, enabled = true) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: documentKeys.detail(id || ""),
    queryFn: () => getDocument(id!),
    enabled: !loading && Boolean(user) && Boolean(id) && enabled,
    staleTime: 10 * 60 * 1000,
  });
}
