"use client";

import { useQuery } from "@tanstack/react-query";
import { getChatDetail } from "./chat.api";

export const chatKeys = {
  all: ["chats"] as const,
  detail: (sessionId: string) => ["chats", "detail", sessionId] as const,
  messages: (sessionId: string) => ["chats", "detail", sessionId] as const,
};

export function useMessages(sessionId?: string) {
  return useQuery({
    queryKey: chatKeys.detail(sessionId || ""),
    queryFn: () => getChatDetail(sessionId!),
    enabled: Boolean(sessionId),
    select: (detail) => detail.messages,
  });
}

export function useChatDetail(sessionId?: string) {
  return useQuery({
    queryKey: chatKeys.detail(sessionId || ""),
    queryFn: () => getChatDetail(sessionId!),
    enabled: Boolean(sessionId),
  });
}
