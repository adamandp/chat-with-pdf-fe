import { delay, http, HttpResponse } from "msw";
import type { Session } from "@/interface/chat-session.interface";
import { paginate, persistStore, store } from "../data/store";

function summary(session: Session) {
  return {
    id: session.id,
    title: session.title,
    isPinned: session.isPinned,
    updatedAt: session.updatedAt,
  };
}

function list(request: Request, deleted: boolean) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") || "").toLowerCase();
  const order = params.get("order") === "asc" ? 1 : -1;
  const results = store.sessions
    .filter((item) => Boolean(item.deletedAt) === deleted && item.title.toLowerCase().includes(q))
    .sort((a, b) =>
      deleted
        ? order * a.updatedAt.localeCompare(b.updatedAt)
        : Number(b.isPinned) - Number(a.isPinned) || order * a.updatedAt.localeCompare(b.updatedAt),
    )
    .map(summary);
  return paginate(results, Number(params.get("page") || 1), Number(params.get("limit") || 20));
}

export const sessionHandlers = [
  http.get("*/api/chat-sessions", async ({ request }) => {
    await delay(100);
    return HttpResponse.json({ message: "Chat sessions retrieved", ...list(request, false) });
  }),
  http.get("*/api/chat-sessions/deleted", async ({ request }) => {
    await delay(100);
    return HttpResponse.json({
      message: "Deleted chat sessions retrieved",
      ...list(request, true),
    });
  }),
  http.get("*/api/chat-sessions/:id/chats", ({ params }) => {
    const session = store.sessions.find((item) => item.id === params.id && !item.deletedAt);
    return session
      ? HttpResponse.json({ data: store.messages.filter((item) => item.sessionId === session.id) })
      : HttpResponse.json({ message: "Session not found" }, { status: 404 });
  }),
  http.patch("*/api/chat-sessions/:id", async ({ params, request }) => {
    const session = store.sessions.find((item) => item.id === params.id && !item.deletedAt);
    if (!session) return HttpResponse.json({ message: "Chat session not found" }, { status: 404 });
    const body = (await request.json()) as { title?: string; isPinned?: boolean };
    if (body.title === undefined && body.isPinned === undefined)
      return HttpResponse.json({ message: "At least one update field required" }, { status: 400 });
    if (body.title !== undefined) {
      if (!body.title.trim())
        return HttpResponse.json({ message: "Title required" }, { status: 400 });
      session.title = body.title.trim().slice(0, 255);
    }
    if (body.isPinned !== undefined) session.isPinned = body.isPinned;
    session.updatedAt = new Date().toISOString();
    persistStore();
    return HttpResponse.json({ message: "Chat session updated", data: summary(session) });
  }),
  http.delete("*/api/chat-sessions/:id/permanent", ({ params }) => {
    const index = store.sessions.findIndex((item) => item.id === params.id && item.deletedAt);
    if (index < 0)
      return HttpResponse.json({ message: "Deleted chat session not found" }, { status: 404 });
    const [session] = store.sessions.splice(index, 1);
    store.messages = store.messages.filter((message) => message.sessionId !== session.id);
    persistStore();
    return HttpResponse.json({
      message: "Chat session permanently deleted",
      data: summary(session),
    });
  }),
  http.delete("*/api/chat-sessions/:id", ({ params }) => {
    const session = store.sessions.find((item) => item.id === params.id && !item.deletedAt);
    if (!session) return HttpResponse.json({ message: "Chat session not found" }, { status: 404 });
    session.deletedAt = new Date().toISOString();
    session.updatedAt = session.deletedAt;
    persistStore();
    return HttpResponse.json({ message: "Chat session deleted", data: summary(session) });
  }),
  http.post("*/api/chat-sessions/:id/restore", ({ params }) => {
    const session = store.sessions.find((item) => item.id === params.id && item.deletedAt);
    if (!session)
      return HttpResponse.json({ message: "Deleted chat session not found" }, { status: 404 });
    session.deletedAt = null;
    session.updatedAt = new Date().toISOString();
    persistStore();
    return HttpResponse.json({ message: "Chat session restored", data: summary(session) });
  }),
];
