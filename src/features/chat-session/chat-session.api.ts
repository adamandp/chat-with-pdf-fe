import { axiosInstance } from "@/lib/axios";
import type { Session } from "@/interface/chat-session.interface";
import type { WebResponse } from "@/interface/common.interface";
import { getChatDetail } from "@/features/chat/chat.api";

type SessionSummary = Pick<Session, "id" | "title" | "updatedAt" | "isPinned">;
export type SessionList = WebResponse<Session[]>;

function toSession(raw: SessionSummary, deleted: boolean): Session {
  return {
    ...raw,
    title: raw.title || "Untitled chat",
    isPinned: raw.isPinned ?? false,
    documentIds: [],
    deletedAt: deleted ? raw.updatedAt : null,
  };
}

export async function getSessions(
  deleted = false,
  q = "",
  page = 1,
  limit = 20,
): Promise<SessionList> {
  const { data } = await axiosInstance.get<WebResponse<SessionSummary[]>>(
    deleted ? "/chat-sessions/deleted" : "/chat-sessions",
    { params: { page, limit, ...(q ? { q } : {}) } },
  );
  return { ...data, data: (data.data || []).map((row) => toSession(row, deleted)) };
}

export async function getSession(id: string) {
  return (await getChatDetail(id)).session;
}

export async function updateSession(id: string, body: { title?: string; isPinned?: boolean }) {
  const { data } = await axiosInstance.patch<WebResponse<SessionSummary>>(
    `/chat-sessions/${id}`,
    body,
  );
  return data.data;
}

export async function renameSession(id: string, title: string) {
  return updateSession(id, { title });
}

export async function pinSession(id: string, isPinned: boolean) {
  return updateSession(id, { isPinned });
}

export async function deleteSession(id: string, permanent: boolean) {
  await axiosInstance.delete(`/chat-sessions/${id}${permanent ? "/permanent" : ""}`);
}

export async function restoreSession(id: string) {
  const { data } = await axiosInstance.post<WebResponse<SessionSummary>>(
    `/chat-sessions/${id}/restore`,
  );
  return data.data;
}

/** Sidebar fork uses the current active leaf; the backend requires messageId. */
export async function forkSession(id: string, messageId?: string) {
  const selectedId = messageId || (await getChatDetail(id)).session.activeLeafMessageId;
  if (!selectedId) throw new Error("Send a message before forking this chat");
  const { data } = await axiosInstance.post<WebResponse<{ id: string; title: string }>>(
    `/chat/${id}/fork`,
    { messageId: selectedId },
  );
  return data.data;
}
