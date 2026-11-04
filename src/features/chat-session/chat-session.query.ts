"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getSessions } from "./chat-session.api";
import { getChatDetail } from "@/features/chat/chat.api";
import { chatKeys } from "@/features/chat/chat.query";
import { useAuth } from "@/providers/auth-provider";

export const sessionKeys = {
  all: ["sessions"] as const,
  list: (deleted: boolean, q: string, page: number, limit: number) =>
    ["sessions", "list", deleted, q, page, limit] as const,
  detail: (id: string) => chatKeys.detail(id),
};

export function useSessions(deleted = false, q = "", page = 1, limit = 20) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: sessionKeys.list(deleted, q, page, limit),
    queryFn: () => getSessions(deleted, q, page, limit),
    enabled: !loading && Boolean(user),
  });
}

export function useInfiniteSessions(q = "") {
  const { user, loading } = useAuth();
  return useInfiniteQuery({
    queryKey: [...sessionKeys.all, "infinite", q],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getSessions(false, q, pageParam, 20),
    enabled: !loading && Boolean(user),
    getNextPageParam: (last) => {
      const paging = last.paging;
      return paging && paging.currentPage < paging.totalPages ? paging.currentPage + 1 : undefined;
    },
  });
}

export function useSession(id?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: chatKeys.detail(id || ""),
    queryFn: () => getChatDetail(id!),
    enabled: !loading && Boolean(user) && Boolean(id),
    select: (detail) => detail.session,
  });
}
