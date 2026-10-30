"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editMessage, giveFeedback, sendChat, type SendChatInput } from "./chat.api";
import { chatKeys } from "./chat.query";
import { sessionKeys } from "@/services/sessions/session.query";

export function useSendChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendChatInput) => sendChat(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(result.session.id) });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => editMessage(id, content),
    onSuccess: (message) => queryClient.invalidateQueries({ queryKey: chatKeys.messages(message.sessionId) }),
  });
}

export function useFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: "up" | "down" }) => giveFeedback(id, rating),
    onSuccess: (message) => queryClient.invalidateQueries({ queryKey: chatKeys.messages(message.sessionId) }),
  });
}
