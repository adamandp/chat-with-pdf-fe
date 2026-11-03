import { delay, http, HttpResponse } from "msw";
import type { ChatMessage, Source } from "@/interface/chat.interface";
import type { Session } from "@/interface/chat-session.interface";
import { persistStore, store } from "../data/store";

type SendPayload = {
  question?: string;
  sessionId?: string;
  documentIds?: string[];
  mode?: "quick" | "pro" | "ultra";
  answerMode?: "document_only" | "general";
};

function answer(question: string, mode: string, documentIds: string[]) {
  if (mode === "general")
    return {
      content: `You asked: **${question}**\n\nThis is a simulated general-knowledge reply. Local mode uses your real AI backend.`,
      sources: [] as Source[],
    };
  if (!documentIds.length)
    return {
      content: "Choose a PDF from your library to answer from documents. This is a demo response.",
      sources: [] as Source[],
    };
  const sources = documentIds.slice(0, 3).map((documentId, index) => ({
    documentId,
    page: [12, 8, 15][index],
  }));
  return {
    content: `Here is a demo summary for **${question}**\n\n1. **Key findings**\nThe selected documents contain useful trends and supporting details [1].\n\n2. **Comparison**\nCross-document insights can be compared using their cited pages [2].\n\n3. **Next steps**\nOpen the sources to inspect the relevant pages. This response is simulated.`,
    sources,
  };
}

function sessionById(id: string) {
  return store.sessions.find((item) => item.id === id && !item.deletedAt);
}

function chain(sessionId: string, leafId?: string | null): ChatMessage[] {
  const messages = store.messages.filter((message) => message.sessionId === sessionId);
  if (!leafId) return messages;
  const result: ChatMessage[] = [];
  const visited = new Set<string>();
  let cursor = messages.find((message) => message.id === leafId);
  while (cursor && !visited.has(cursor.id)) {
    result.unshift(cursor);
    visited.add(cursor.id);
    cursor = messages.find((message) => message.id === cursor?.parentMessageId);
  }
  return result;
}

function newMessage(
  sessionId: string,
  role: ChatMessage["role"],
  content: string,
  parentMessageId: string | null,
  sources: Source[] = [],
  versionGroupId = crypto.randomUUID(),
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    sessionId,
    role,
    content,
    sources,
    createdAt: new Date().toISOString(),
    parentMessageId,
    versionGroupId,
    status: "completed",
  };
}

function details(session: Session) {
  const activeMessages = chain(session.id, session.activeLeafMessageId);
  return {
    id: session.id,
    title: session.title,
    answerMode: session.answerMode || "document_only",
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    activeLeafMessageId: session.activeLeafMessageId || null,
    documents: session.documentIds
      .map((id) => store.documents.find((document) => document.id === id))
      .filter((doc) => Boolean(doc))
      .map((doc) => ({
        id: doc!.id,
        fileName: doc!.name,
        pageCount: doc!.pages,
        status: doc!.status || "READY",
        deletedAt: doc!.deletedAt,
      })),
    messages: activeMessages.map((message) => {
      const group = message.versionGroupId || message.id;
      const versions = store.messages
        .filter(
          (candidate) =>
            candidate.sessionId === session.id &&
            (candidate.versionGroupId || candidate.id) === group,
        )
        .map((candidate) => ({
          id: candidate.id,
          status: (candidate.status || "completed").toUpperCase(),
          createdAt: candidate.createdAt,
          active: candidate.id === message.id,
        }));
      return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        parentMessageId: message.parentMessageId || null,
        versionGroupId: group,
        versionCount: versions.length,
        versions,
        status: (message.status || "completed").toUpperCase(),
        feedback:
          message.feedback === "up" ? "LIKE" : message.feedback === "down" ? "DISLIKE" : null,
        sources: message.sources.map((source) => ({
          documentId: source.documentId,
          pageNumber: source.page,
        })),
      };
    }),
  };
}

function sse(
  session: Session,
  userMessage: ChatMessage | null,
  assistant: ChatMessage,
  mode: string,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (type: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      push("started", { id: assistant.id, sessionId: session.id, status: "streaming" });
      if (assistant.sources.length) {
        push("sources", {
          sources: assistant.sources.map(({ documentId, page }) => ({
            documentId,
            pageNumber: page,
            chunkId: crypto.randomUUID(),
            filename: store.documents.find((document) => document.id === documentId)?.name || null,
          })),
        });
      }
      const result = assistant.content;
      // The stored message is only completed when the stream finishes.
      assistant.status = "streaming";
      assistant.content = "";
      for (const token of result.match(/[\s\S]{1,28}/g) || [result]) {
        await delay(25);
        assistant.content += token;
        push("token", { content: token });
      }
      assistant.status = "completed";
      persistStore();
      push("done", {
        id: assistant.id,
        sessionId: session.id,
        status: "completed",
        content: assistant.content,
        sources: assistant.sources.map(({ documentId, page }) => ({
          documentId,
          pageNumber: page,
          chunkId: crypto.randomUUID(),
          filename: null,
        })),
        mode,
      });
      controller.close();
    },
  });
  void userMessage;
  return new HttpResponse(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

export const chatHandlers = [
  http.get("*/api/chat/:id/details", ({ params }) => {
    const session = sessionById(String(params.id));
    return session
      ? HttpResponse.json({ message: "Chat detail retrieved", data: details(session) })
      : HttpResponse.json({ message: "Chat session not found" }, { status: 404 });
  }),
  http.post("*/api/chat/send", async ({ request }) => {
    const payload = (await request.json()) as SendPayload;
    const question = payload.question?.trim();
    if (!question) return HttpResponse.json({ message: "Question required" }, { status: 400 });
    if (payload.mode && !["quick", "pro", "ultra"].includes(payload.mode))
      return HttpResponse.json({ message: "Invalid thinking mode" }, { status: 400 });
    let session = payload.sessionId ? sessionById(payload.sessionId) : undefined;
    if (payload.sessionId && !session)
      return HttpResponse.json({ message: "Chat not found" }, { status: 404 });
    const now = new Date().toISOString();
    const ids = (payload.documentIds || []).filter((id) =>
      store.documents.some(
        (document) =>
          document.id === id && !document.deletedAt && (document.status || "READY") === "READY",
      ),
    );
    if (!session) {
      session = {
        id: crypto.randomUUID(),
        title: question.slice(0, 80),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        isPinned: false,
        documentIds: [],
        activeLeafMessageId: null,
      };
      store.sessions.unshift(session);
    }
    session.documentIds = [...new Set([...session.documentIds, ...ids])];
    session.answerMode = payload.answerMode || "general";
    session.updatedAt = now;
    const user = newMessage(session.id, "user", question, session.activeLeafMessageId || null);
    const generated = answer(question, session.answerMode, session.documentIds);
    const assistant = newMessage(
      session.id,
      "assistant",
      generated.content,
      user.id,
      generated.sources,
    );
    store.messages.push(user, assistant);
    session.activeLeafMessageId = assistant.id;
    persistStore();
    return sse(session, user, assistant, payload.mode || "quick");
  }),
  http.post("*/api/chat/:messageId/edit", async ({ params, request }) => {
    const target = store.messages.find(
      (item) => item.id === params.messageId && item.role === "user",
    );
    const session = target && sessionById(target.sessionId);
    if (!target || !session)
      return HttpResponse.json({ message: "Message not found" }, { status: 404 });
    const payload = (await request.json()) as SendPayload;
    const question = payload.question?.trim();
    if (!question) return HttpResponse.json({ message: "Question required" }, { status: 400 });
    const edited = newMessage(
      session.id,
      "user",
      question,
      target.parentMessageId || null,
      [],
      target.versionGroupId || target.id,
    );
    const generated = answer(question, payload.answerMode || "document_only", session.documentIds);
    const assistant = newMessage(
      session.id,
      "assistant",
      generated.content,
      edited.id,
      generated.sources,
    );
    store.messages.push(edited, assistant);
    session.activeLeafMessageId = assistant.id;
    session.updatedAt = new Date().toISOString();
    persistStore();
    return sse(session, edited, assistant, payload.mode || "quick");
  }),
  http.post("*/api/chat/:messageId/regenerate", async ({ params, request }) => {
    const target = store.messages.find(
      (item) => item.id === params.messageId && item.role === "assistant",
    );
    const session = target && sessionById(target.sessionId);
    if (!target || !session)
      return HttpResponse.json({ message: "Answer not found" }, { status: 404 });
    const { mode } = (await request.json()) as { mode?: string };
    if (!mode || !["quick", "pro", "ultra"].includes(mode))
      return HttpResponse.json({ message: "Invalid mode" }, { status: 400 });
    const user = store.messages.find((item) => item.id === target.parentMessageId);
    if (!user) return HttpResponse.json({ message: "Question not found" }, { status: 404 });
    const generated = answer(
      user.content,
      session.answerMode || "document_only",
      session.documentIds,
    );
    const versions = store.messages.filter((item) => item.versionGroupId === target.versionGroupId);
    const assistant = newMessage(
      session.id,
      "assistant",
      generated.content + `\n\n*Demo version ${versions.length + 1} (${mode}).*`,
      user.id,
      generated.sources,
      target.versionGroupId || target.id,
    );
    store.messages.push(assistant);
    session.activeLeafMessageId = assistant.id;
    session.updatedAt = new Date().toISOString();
    persistStore();
    return sse(session, null, assistant, mode);
  }),
  http.post("*/api/chat/:id/fork", async ({ params, request }) => {
    const source = sessionById(String(params.id));
    if (!source) return HttpResponse.json({ message: "Chat not found" }, { status: 404 });
    const { messageId } = (await request.json()) as { messageId?: string };
    if (!messageId) return HttpResponse.json({ message: "messageId required" }, { status: 400 });
    const selected = chain(source.id, messageId);
    if (!selected.length || selected.at(-1)?.id !== messageId)
      return HttpResponse.json({ message: "Message not found" }, { status: 404 });
    const now = new Date().toISOString();
    const fork: Session = {
      id: crypto.randomUUID(),
      title: `Fork → ${source.title}`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      documentIds: [...source.documentIds],
      isPinned: false,
      answerMode: source.answerMode,
    };
    const ids = new Map(selected.map((message) => [message.id, crypto.randomUUID()]));
    const copies = selected.map((message) => ({
      ...message,
      id: ids.get(message.id)!,
      sessionId: fork.id,
      parentMessageId: message.parentMessageId ? ids.get(message.parentMessageId) || null : null,
      versionGroupId: crypto.randomUUID(),
      sources: message.sources.map((source) => ({ ...source })),
    }));
    fork.activeLeafMessageId = copies.at(-1)?.id || null;
    store.sessions.unshift(fork);
    store.messages.push(...copies);
    persistStore();
    return HttpResponse.json(
      { message: "Chat forked", data: { id: fork.id, title: fork.title } },
      { status: 201 },
    );
  }),
  http.patch("*/api/chat/:messageId/activate", ({ params }) => {
    const target = store.messages.find((item) => item.id === params.messageId);
    const session = target && sessionById(target.sessionId);
    if (!target || !session)
      return HttpResponse.json({ message: "Message not found" }, { status: 404 });
    let leaf = target;
    const visited = new Set<string>();
    while (!visited.has(leaf.id)) {
      visited.add(leaf.id);
      const child = store.messages
        .filter(
          (candidate) =>
            candidate.sessionId === session.id && candidate.parentMessageId === leaf.id,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (!child) break;
      leaf = child;
    }
    session.activeLeafMessageId = leaf.id;
    persistStore();
    return HttpResponse.json({
      message: "Version activated",
      data: { activeLeafMessageId: leaf.id },
    });
  }),
  http.post("*/api/chat/:messageId/feedback", async ({ params, request }) => {
    const message = store.messages.find(
      (item) => item.id === params.messageId && item.role === "assistant",
    );
    if (!message) return HttpResponse.json({ message: "Answer not found" }, { status: 404 });
    const { type } = (await request.json()) as { type?: string };
    if (!["LIKE", "DISLIKE"].includes(type || ""))
      return HttpResponse.json({ message: "Invalid feedback" }, { status: 400 });
    const selected = type === "LIKE" ? "up" : "down";
    message.feedback = message.feedback === selected ? undefined : selected;
    persistStore();
    return new HttpResponse(null, { status: 204 });
  }),
];
