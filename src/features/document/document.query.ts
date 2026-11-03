"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocument, getDocuments, type DocumentFilters } from "./document.api";

export const documentKeys = {
  all: ["documents"] as const,
  list: (filters: DocumentFilters) => ["documents", "list", filters] as const,
  detail: (id: string) => ["documents", "detail", id] as const,
};

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({ queryKey: documentKeys.list(filters), queryFn: () => getDocuments(filters) });
}

export function useDocument(id?: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(id || ""),
    queryFn: () => getDocument(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 10 * 60 * 1000,
  });
}
