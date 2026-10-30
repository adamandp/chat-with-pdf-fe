import { axiosInstance } from "@/lib/axios";
import type { AnswerMode, ThinkingMode, ChatMessage, ChatResponse, WebResponse } from "@/features/common/types";

export async function getMessages(sessionId: string) {
  const { data } = await axiosInstance.get<WebResponse<ChatMessage[]>>(`/sessions/${sessionId}/chats`);
  return data.data;
}
export interface SendChatInput { sessionId?: string; message: string; mode: AnswerMode; thinkingMode: ThinkingMode; documentIds: string[] }
export async function sendChat(input: SendChatInput) {
  const form = new FormData();
  form.append("sessionId", input.sessionId || "");
  form.append("message", input.message);
  form.append("mode", input.mode);
  form.append("thinkingMode", input.thinkingMode);
  form.append("documentIds", JSON.stringify(input.documentIds));
  const { data } = await axiosInstance.post<WebResponse<ChatResponse>>("/chats", form);
  return data.data;
}
export async function editMessage(id: string, content: string) {
  const { data } = await axiosInstance.patch<WebResponse<ChatMessage>>(`/messages/${id}`, { content });
  return data.data;
}
export async function giveFeedback(messageId: string, rating: "up" | "down") {
  const { data } = await axiosInstance.post<WebResponse<ChatMessage>>("/feedback", { messageId, rating });
  return data.data;
}
