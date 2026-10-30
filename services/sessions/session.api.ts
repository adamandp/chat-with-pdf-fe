import { axiosInstance } from "@/lib/axios";
import type { Session, WebResponse } from "@/features/common/types";

export async function getSessions(deleted = false, q = "") {
  const { data } = await axiosInstance.get<WebResponse<Session[]>>("/sessions", { params: { deleted, q } });
  return data.data;
}
export async function getSession(id: string) {
  const { data } = await axiosInstance.get<WebResponse<Session>>(`/sessions/${id}`);
  return data.data;
}
export async function renameSession(id: string, title: string) {
  const { data } = await axiosInstance.patch<WebResponse<Session>>(`/sessions/${id}`, { title });
  return data.data;
}
export async function deleteSession(id: string, permanent: boolean) {
  await axiosInstance.delete(`/sessions/${id}`, { params: { permanent } });
}
export async function restoreSession(id: string) {
  const { data } = await axiosInstance.post<WebResponse<Session>>(`/sessions/${id}/restore`);
  return data.data;
}

/** Forks a full session, or its history through a selected message. */
export async function forkSession(id: string, messageId?: string) {
  const { data } = await axiosInstance.post<WebResponse<Session>>(`/sessions/${id}/fork`, { messageId });
  return data.data;
}
