"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateVersion,
  editMessage,
  giveFeedback,
  regenerateAnswer,
  sendChat,
  type SendChatInput,
} from "./chat.api";
import { chatKeys } from "./chat.query";
import type { ThinkingMode } from "@/interface/chat.interface";
import type { StreamEvent } from "@/lib/sse";
import { sessionKeys } from "@/features/chat-session/chat-session.query";

function useChatInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    if (id) void queryClient.invalidateQueries({ queryKey: chatKeys.detail(id) });
  };
}

export function useSendChat() {
  const invalidate = useChatInvalidation();
  return useMutation({
    mutationFn: sendChat,
    onSuccess: (detail) => invalidate(detail.session.id),
  });
}

export function useEditMessage() {
  const invalidate = useChatInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SendChatInput }) => editMessage(id, input),
    onSuccess: (sessionId) => invalidate(sessionId),
  });
}

export function useFeedback() {
  const invalidate = useChatInvalidation();
  return useMutation({
    mutationFn: ({
      id,
      sessionId,
      rating,
    }: {
      id: string;
      sessionId: string;
      rating: "up" | "down";
    }) => giveFeedback(id, rating).then(() => sessionId),
    onSuccess: (sessionId) => invalidate(sessionId),
  });
}

export function useRegenerateAnswer() {
  const invalidate = useChatInvalidation();
  return useMutation({
    mutationFn: ({
      messageId,
      thinkingMode,
      onEvent,
    }: {
      messageId: string;
      thinkingMode: ThinkingMode;
      onEvent?: (event: StreamEvent) => void;
    }) => regenerateAnswer(messageId, thinkingMode, onEvent),
    onSuccess: (sessionId) => invalidate(sessionId),
  });
}

export function useActivateVersion() {
  const invalidate = useChatInvalidation();
  return useMutation({
    mutationFn: ({ messageId, sessionId }: { messageId: string; sessionId: string }) =>
      activateVersion(messageId).then(() => sessionId),
    onSuccess: (sessionId) => invalidate(sessionId),
  });
}
