"use client";

import { useQuery } from "@tanstack/react-query";
import { getChatDetail } from "./chat.api";
import { useAuth } from "@/providers/auth-provider";

export const chatKeys = {
  all: ["chats"] as const,
  detail: (sessionId: string) => ["chats", "detail", sessionId] as const,
  messages: (sessionId: string) => ["chats", "detail", sessionId] as const,
};

export function useMessages(sessionId?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: chatKeys.detail(sessionId || ""),
    queryFn: () => getChatDetail(sessionId!),
    enabled: !loading && Boolean(user) && Boolean(sessionId),
    select: (detail) => detail.messages,
  });
}

export function useChatDetail(sessionId?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: chatKeys.detail(sessionId || ""),
    queryFn: () => getChatDetail(sessionId!),
    enabled: !loading && Boolean(user) && Boolean(sessionId),
  });
}
