import { delay, http, HttpResponse } from "msw";
import type { ChatMessage, Session } from "@/features/common/types";
import { store } from "../data/store";

export const sessionHandlers = [
  http.post("*/api/sessions/:id/fork", async ({ params, request }) => {
    await delay(120);
    const source = store.sessions.find((item) => item.id === params.id && !item.deletedAt);
    if (!source) return HttpResponse.json({ message: "Source session not found" }, { status: 404 });
    const { messageId } = await request.json().catch(() => ({})) as { messageId?: string };
    const originals = store.messages.filter((message) => message.sessionId === source.id);
    const cutIndex = messageId ? originals.findIndex((message) => message.id === messageId) : originals.length - 1;
    if (messageId && cutIndex < 0) return HttpResponse.json({ message: "Message not found in source session" }, { status: 404 });
    const now = new Date().toISOString();
    const fork: Session = {
      id: crypto.randomUUID(),
      title: `Fork: ${source.title}`.slice(0, 120),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      documentIds: [...source.documentIds],
      forkedFromSessionId: source.id,
      ...(messageId ? { forkedFromMessageId: messageId } : {}),
    };
    const cloned: ChatMessage[] = originals.slice(0, cutIndex + 1).map((message) => ({
      ...message,
      id: crypto.randomUUID(),
      sessionId: fork.id,
      sources: message.sources.map((item) => ({ ...item })),
    }));
    store.sessions.unshift(fork);
    store.messages.push(...cloned);
    return HttpResponse.json({ data: fork }, { status: 201 });
  }),
  http.get("*/api/sessions", async ({ request }) => {
    await delay(130);
    const url = new URL(request.url);
    const deleted = url.searchParams.get("deleted") === "true";
    const search = (url.searchParams.get("q") || "").toLowerCase();
    const data = store.sessions.filter((item) => Boolean(item.deletedAt) === deleted && item.title.toLowerCase().includes(search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return HttpResponse.json({ data });
  }),
  http.get("*/api/sessions/:id", ({ params }) => {
    const session = store.sessions.find((item) => item.id === params.id && !item.deletedAt);
    return session ? HttpResponse.json({ data: session }) : HttpResponse.json({ message: "Session not found" }, { status: 404 });
  }),
  http.patch("*/api/sessions/:id", async ({ params, request }) => {
    const session = store.sessions.find((item) => item.id === params.id && !item.deletedAt);
    if (!session) return HttpResponse.json({ message: "Session not found" }, { status: 404 });
    const payload = await request.json() as { title?: string };
    if (!payload.title?.trim()) return HttpResponse.json({ message: "Title is required" }, { status: 400 });
    session.title = payload.title.trim().slice(0, 120);
    session.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: session satisfies Session });
  }),
  http.delete("*/api/sessions/:id", ({ params, request }) => {
    const index = store.sessions.findIndex((item) => item.id === params.id);
    if (index < 0) return HttpResponse.json({ message: "Session not found" }, { status: 404 });
    const permanent = new URL(request.url).searchParams.get("permanent") === "true";
    if (permanent) {
      store.sessions.splice(index, 1);
      store.messages = store.messages.filter((message) => message.sessionId !== params.id);
    } else {
      store.sessions[index].deletedAt = new Date().toISOString();
    }
    return new HttpResponse(null, { status: 204 });
  }),
  http.post("*/api/sessions/:id/restore", ({ params }) => {
    const session = store.sessions.find((item) => item.id === params.id && item.deletedAt);
    if (!session) return HttpResponse.json({ message: "Deleted session not found" }, { status: 404 });
    session.deletedAt = null;
    session.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: session });
  }),
];
