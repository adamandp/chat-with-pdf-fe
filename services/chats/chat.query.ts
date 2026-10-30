"use client";

import { useQuery } from "@tanstack/react-query";
import { getMessages } from "./chat.api";

export const chatKeys = {
  all: ["chats"] as const,
  messages: (sessionId: string) => ["chats", sessionId] as const,
};

export function useMessages(sessionId?: string) {
  return useQuery({
    queryKey: chatKeys.messages(sessionId || ""),
    queryFn: () => getMessages(sessionId!),
    enabled: Boolean(sessionId),
  });
}
