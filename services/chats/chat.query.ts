"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { editMessage, getMessages, giveFeedback, sendChat } from "./chat.api";
import { sessionKeys } from "@/services/sessions/session.query";
import type { SendChatInput } from "./chat.api";

export const chatKeys = { all: ["chats"] as const, messages: (sessionId: string) => ["chats", sessionId] as const };
export function useMessages(sessionId?: string) {
  return useQuery({ queryKey: chatKeys.messages(sessionId || ""), queryFn: () => getMessages(sessionId!), enabled: Boolean(sessionId) });
}
export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: SendChatInput) => sendChat(input), onSuccess: (result) => {
    qc.invalidateQueries({ queryKey: sessionKeys.all });
    qc.invalidateQueries({ queryKey: chatKeys.messages(result.session.id) });
  } });
}
export function useEditMessage() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, content }: { id: string; content: string }) => editMessage(id, content),
    onSuccess: (message) => qc.invalidateQueries({ queryKey: chatKeys.messages(message.sessionId) }) });
}
export function useFeedback() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, rating }: { id: string; rating: "up" | "down" }) => giveFeedback(id, rating),
    onSuccess: (message) => qc.invalidateQueries({ queryKey: chatKeys.messages(message.sessionId) }) });
}
