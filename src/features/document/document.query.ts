"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocuments, type DocumentFilters } from "./document.api";

export const documentKeys = {
  all: ["documents"] as const,
  list: (filters: DocumentFilters) => ["documents", "list", filters] as const,
};

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({ queryKey: documentKeys.list(filters), queryFn: () => getDocuments(filters) });
}
