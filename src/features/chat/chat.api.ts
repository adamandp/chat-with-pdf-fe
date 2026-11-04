import { axiosInstance } from "@/lib/axios";
import { postSse, type StreamEvent } from "@/lib/sse";
import type {
  AnswerMode,
  ThinkingMode,
  ChatMessage,
  ChatResponse,
} from "@/interface/chat.interface";
import type { Session } from "@/interface/chat-session.interface";
import type { WebResponse } from "@/interface/common.interface";
import { toPdfDocument, type RawDocument } from "@/features/document/document.api";

interface RawMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string | null;
  status: string;
  parentMessageId: string | null;
  versionGroupId: string;
  versionCount: number;
  versions: { id: string; status: string; createdAt: string | null; active: boolean }[];
  feedback: "LIKE" | "DISLIKE" | null;
  sources: { documentId: string; pageNumber: number }[];
}

interface RawChatDetail {
  id: string;
  title: string | null;
  answerMode: "general" | "document_only" | null;
  createdAt: string | null;
  updatedAt: string | null;
  activeLeafMessageId: string | null;
  documents: Pick<RawDocument, "id" | "fileName" | "pageCount" | "status" | "deletedAt">[];
  messages: RawMessage[];
}

export async function getChatDetail(sessionId: string): Promise<ChatResponse> {
  const { data } = await axiosInstance.get<WebResponse<RawChatDetail>>(
    `/chat/${sessionId}/details`,
  );
  const raw = data.data;
  const session: Session = {
    id: raw.id,
    title: raw.title || "Untitled chat",
    createdAt: raw.createdAt || undefined,
    updatedAt: raw.updatedAt || raw.createdAt || new Date(0).toISOString(),
    deletedAt: null,
    isPinned: false,
    answerMode: raw.answerMode || "general",
    activeLeafMessageId: raw.activeLeafMessageId,
    documentIds: raw.documents.map((document) => document.id),
  };
  return {
    session,
    documents: raw.documents.map((document) =>
      toPdfDocument({
        ...document,
        fileSize: null,
        createdAt: null,
        updatedAt: null,
      }),
    ),
    messages: raw.messages.map((message): ChatMessage => ({
      id: message.id,
      sessionId: sessionId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt || new Date(0).toISOString(),
      sources: (message.sources || []).map(({ documentId, pageNumber }) => ({
        documentId,
        page: pageNumber,
      })),
      feedback:
        message.feedback === "LIKE" ? "up" : message.feedback === "DISLIKE" ? "down" : undefined,
      status: message.status?.toLowerCase() as ChatMessage["status"],
      parentMessageId: message.parentMessageId,
      versionGroupId: message.versionGroupId,
      versionCount: message.versionCount,
      versions: message.versions,
    })),
  };
}

export interface SendChatInput {
  sessionId?: string;
  message: string;
  mode: AnswerMode;
  thinkingMode: ThinkingMode;
  documentIds: string[];
  onEvent?: (event: StreamEvent) => void;
}

function sendBody(input: SendChatInput) {
  return {
    question: input.message,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.documentIds.length ? { documentIds: input.documentIds } : {}),
    mode: input.thinkingMode,
    answerMode: input.mode === "document" ? "document_only" : "general",
  };
}

export async function sendChat(input: SendChatInput) {
  const done = await postSse("/chat/send", sendBody(input), input.onEvent);
  return getChatDetail(done.sessionId);
}

export async function editMessage(id: string, input: SendChatInput) {
  const done = await postSse(`/chat/${id}/edit`, sendBody(input), input.onEvent);
  return done.sessionId;
}

export async function regenerateAnswer(
  messageId: string,
  thinkingMode: ThinkingMode,
  onEvent?: (event: StreamEvent) => void,
) {
  const done = await postSse(`/chat/${messageId}/regenerate`, { mode: thinkingMode }, onEvent);
  return done.sessionId;
}

export async function giveFeedback(messageId: string, rating: "up" | "down") {
  await axiosInstance.post(`/chat/${messageId}/feedback`, {
    type: rating === "up" ? "LIKE" : "DISLIKE",
  });
}

export async function activateVersion(messageId: string) {
  await axiosInstance.patch(`/chat/${messageId}/activate`);
}
