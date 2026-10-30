import { delay, http, HttpResponse } from "msw";
import type { AnswerMode, ThinkingMode, ChatMessage, Session, Source } from "@/features/common/types";
import { store } from "../data/store";

function simulateAnswer(message: string, mode: AnswerMode, documentIds: string[]): { content: string; sources: Source[] } {
  if (mode === "document" && documentIds.length === 0)
    return { content: "Choose a PDF from your library or upload one first, then I can answer using its contents.", sources: [] };
  if (mode === "general")
    return { content: `You asked: **${message}**\n\nThis is a simulated general-knowledge reply. Connect an AI backend to generate a real answer.`, sources: [] };
  const sources = documentIds.slice(0, 3).map((documentId, index) => ({ documentId, page: [12, 8, 15][index] }));
  return { content: `Here is a demo summary for **${message}**\n\n1. **Key findings**\nThe selected documents contain useful trends, analysis, and supporting details [1].\n\n2. **Comparison**\nCross-document insights can be compared using their cited pages [2].\n\n3. **Next steps**\nOpen the sources below to inspect the referenced pages. This response is simulated until your AI backend is connected.`, sources };
}

export const chatHandlers = [
  http.get("*/api/sessions/:id/chats", async ({ params }) => {
    await delay(130);
    const session = store.sessions.find((item) => item.id === params.id && !item.deletedAt);
    if (!session) return HttpResponse.json({ message: "Session not found" }, { status: 404 });
    return HttpResponse.json({ data: store.messages.filter((message) => message.sessionId === session.id) });
  }),
  http.post("*/api/chats", async ({ request }) => {
    await delay(580);
    const payload = await request.formData();
    const question = String(payload.get("message") || "").trim();
    if (!question) return HttpResponse.json({ message: "A message is required" }, { status: 400 });
    const mode: AnswerMode = payload.get("mode") === "general" ? "general" : "document";
    // The standalone demo accepts thinking mode; the simulated answer does not change reasoning effort.
    const thinkingMode = String(payload.get("thinkingMode") || "quick");
    if (!["quick", "pro", "ultra"].includes(thinkingMode)) return HttpResponse.json({ message: "Invalid thinking mode" }, { status: 400 });
    const sessionId = String(payload.get("sessionId") || "");
    let session = store.sessions.find((item) => item.id === sessionId && !item.deletedAt);
    let ids: string[] = [];
    try { ids = JSON.parse(String(payload.get("documentIds") || "[]")) as string[]; } catch { ids = []; }
    ids = ids.filter((id) => store.documents.some((doc) => doc.id === id && !doc.deletedAt));
    const now = new Date().toISOString();
    if (!session) {
      session = {
        id: crypto.randomUUID(), title: question.slice(0, 42), createdAt: now,
        updatedAt: now, deletedAt: null, documentIds: ids,
      } satisfies Session;
      store.sessions.unshift(session);
    } else {
      session.updatedAt = now;
      session.documentIds = [...new Set([...session.documentIds, ...ids])];
    }
    const userMessage: ChatMessage = { id: crypto.randomUUID(), sessionId: session.id, role: "user", content: question, sources: [], createdAt: now };
    const generated = simulateAnswer(question, mode, session.documentIds);
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(), sessionId: session.id, role: "assistant",
      content: generated.content, sources: generated.sources, createdAt: new Date().toISOString(),
    };
    store.messages.push(userMessage, assistantMessage);
    return HttpResponse.json({ data: { session, messages: [userMessage, assistantMessage] } }, { status: 201 });
  }),
  http.post("*/api/messages/:id/regenerate", async ({ params, request }) => {
    await delay(400);
    const target = store.messages.find((message) => message.id === params.id && message.role === "assistant");
    if (!target) return HttpResponse.json({ message: "Assistant message not found" }, { status: 404 });
    const session = store.sessions.find((item) => item.id === target.sessionId && !item.deletedAt);
    if (!session) return HttpResponse.json({ message: "Session not found" }, { status: 404 });
    const history = store.messages.filter((item) => item.sessionId === session.id);
    const index = history.findIndex((message) => message.id === target.id);
    const previousUser = history.slice(0, index).reverse().find((message) => message.role === "user");
    if (!previousUser) return HttpResponse.json({ message: "Original question not found" }, { status: 422 });
    const payload = await request.json().catch(() => ({})) as { mode?: AnswerMode; thinkingMode?: ThinkingMode };
    if (payload.thinkingMode && !["quick", "pro", "ultra"].includes(payload.thinkingMode))
      return HttpResponse.json({ message: "Invalid thinking mode" }, { status: 400 });
    const mode: AnswerMode = payload.mode === "general" ? "general" : "document";
    const next = (target.regenerationCount || 0) + 1;
    const result = simulateAnswer(previousUser.content, mode, session.documentIds);
    target.content = result.content + `\n\n*Regenerated demo response #${next} (thinking: ${payload.thinkingMode || "quick"}).* `;
    target.sources = result.sources;
    target.regenerationCount = next;
    target.feedback = undefined;
    target.createdAt = new Date().toISOString();
    session.updatedAt = target.createdAt;
    return HttpResponse.json({ data: target });
  }),
  http.patch("*/api/messages/:id", async ({ params, request }) => {
    const message = store.messages.find((item) => item.id === params.id && item.role === "user");
    if (!message) return HttpResponse.json({ message: "Message not found" }, { status: 404 });
    const payload = await request.json() as { content?: string };
    if (!payload.content?.trim()) return HttpResponse.json({ message: "Message cannot be empty" }, { status: 400 });
    message.content = payload.content.trim();
    return HttpResponse.json({ data: message });
  }),
  http.post("*/api/feedback", async ({ request }) => {
    const { messageId, rating } = await request.json() as { messageId?: string; rating?: "up" | "down" };
    const message = store.messages.find((item) => item.id === messageId && item.role === "assistant");
    if (!message || !["up", "down"].includes(rating || ""))
      return HttpResponse.json({ message: "Invalid feedback" }, { status: 400 });
    message.feedback = rating;
    return HttpResponse.json({ data: message }, { status: 201 });
  }),
];
