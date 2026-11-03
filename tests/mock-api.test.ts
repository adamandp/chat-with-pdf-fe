import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { server } from "../src/mocks/server";
import { persistStore, store } from "../src/mocks/data/store";
import { postSse } from "../src/lib/sse";
import { axiosInstance, setAccessToken } from "../src/lib/axios";

const api = "http://localhost:3030/api";
const jsonHeaders = { "Content-Type": "application/json" };
const post = (path: string, body: object) =>
  fetch(api + path, { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("backend-compatible MSW contracts", () => {
  test("auth login, profile, refresh and logout", async () => {
    const login = await post("/auth/login", { username: "demo", password: "demo12345" });
    expect(login.status).toBe(200);
    const token = (await login.json()) as { data: { accessToken: string } };
    expect(token.data.accessToken).toBeTruthy();
    const profile = await fetch(api + "/auth/profile");
    expect(((await profile.json()) as { data: { username: string } }).data.username).toBe("demo");
    const refreshed = await post("/session/refresh", {});
    expect(refreshed.status).toBe(200);
    expect((await post("/auth/logout", {})).status).toBe(200);
    expect((await post("/session/refresh", {})).status).toBe(401);
  });

  test("registered demo credentials are verified without storing a plaintext password", async () => {
    const registered = await post("/auth/register", {
      username: "test_user",
      password: "Example12345",
      name: "Test Account",
    });
    expect(registered.status).toBe(201);
    const wrong = await post("/auth/login", {
      username: "test_user",
      password: "Wrong12345",
    });
    expect(wrong.status).toBe(401);
    const correct = await post("/auth/login", {
      username: "test_user",
      password: "Example12345",
    });
    expect(correct.status).toBe(200);
    await post("/auth/logout", {});
  });

  test("session search, server pagination, pin and restore", async () => {
    const list = await fetch(api + "/chat-sessions?limit=2&page=1&q=report");
    const result = (await list.json()) as {
      data: { id: string }[];
      paging: { totalItems: number };
    };
    expect(result.data.length).toBeLessThanOrEqual(2);
    expect(result.paging.totalItems).toBeGreaterThanOrEqual(1);
    const pin = await fetch(api + "/chat-sessions/session-1", {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ isPinned: true }),
    });
    expect(((await pin.json()) as { data: { isPinned: boolean } }).data.isPinned).toBe(true);
    const sorted = (await (await fetch(api + "/chat-sessions?limit=10")).json()) as {
      data: { id: string }[];
    };
    expect(sorted.data[0].id).toBe("session-1");
    await fetch(api + "/chat-sessions/session-2", { method: "DELETE" });
    const deleted = (await (await fetch(api + "/chat-sessions/deleted")).json()) as {
      data: { id: string }[];
    };
    expect(deleted.data.some((item) => item.id === "session-2")).toBe(true);
    expect((await post("/chat-sessions/session-2/restore", {})).status).toBe(200);
  });

  test("document search/sort/paging and permanent delete preserves metadata", async () => {
    const res = await fetch(api + "/documents?q=Annual&sort=name&order=asc&page=1&limit=4");
    const data = (await res.json()) as {
      data: { fileName: string }[];
      paging: { totalItems: number };
    };
    expect(data.paging.totalItems).toBe(2);
    expect(data.data[0].fileName.localeCompare(data.data[1].fileName)).toBeLessThanOrEqual(0);
    const permanent = await fetch(api + "/documents/deleted-doc-1/permanent", { method: "DELETE" });
    expect(permanent.status).toBe(200);
    const row = store.documents.find((item) => item.id === "deleted-doc-1");
    expect(row?.status).toBe("DELETED");
    expect(row?.deletedAt).toBeTruthy();
    const deleted = (await (await fetch(api + "/documents/deleted")).json()) as {
      data: { id: string }[];
    };
    expect(deleted.data.some((item) => item.id === "deleted-doc-1")).toBe(false);
  });

  test("presigned upload and processing follows backend paths", async () => {
    const response = await post("/document-upload/presigned-url", { fileName: "New.pdf" });
    expect(response.status).toBe(201);
    const payload = (await response.json()) as {
      data: { document_id: string; upload_url: string };
    };
    const { document_id: id, upload_url } = payload.data;
    expect((await post(`/document-upload/${id}/process`, {})).status).toBe(409);
    const uploaded = await fetch("http://localhost:3030" + upload_url, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: new Blob(["%PDF-1.4"], { type: "application/pdf" }),
    });
    expect(uploaded.status).toBe(200);
    expect((await post(`/document-upload/${id}/process`, {})).status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const ready = (await (await fetch(api + "/documents/" + id)).json()) as {
      data: { status: string };
    };
    expect(ready.data.status).toBe("READY");
  });

  test("SSE chat send, regenerate, feedback, edit, fork and activate", async () => {
    const send = await post("/chat/send", {
      question: "Compare reports",
      documentIds: ["doc-1"],
      mode: "pro",
      answerMode: "document_only",
    });
    expect(send.status).toBe(200);
    expect(send.headers.get("content-type")).toContain("text/event-stream");
    const streamed = await send.text();
    expect(streamed).toContain("event: started");
    expect(streamed).toContain("event: token");
    expect(streamed).toContain("event: done");
    const started = streamed.match(/event: started\ndata: ([^\n]+)/);
    expect(started).toBeTruthy();
    const sessionId = (JSON.parse(started![1]) as { sessionId: string }).sessionId;
    const detail = (await (await fetch(api + `/chat/${sessionId}/details`)).json()) as {
      data: { messages: { id: string; role: string; versionCount: number }[] };
    };
    expect(detail.data.messages.length).toBe(2);
    const assistant = detail.data.messages[1];
    const feedback = await post(`/chat/${assistant.id}/feedback`, { type: "LIKE" });
    expect(feedback.status).toBe(204);
    const regenerated = await post(`/chat/${assistant.id}/regenerate`, { mode: "ultra" });
    expect(await regenerated.text()).toContain("event: done");
    const versioned = (await (await fetch(api + `/chat/${sessionId}/details`)).json()) as {
      data: { messages: { id: string; versionCount: number }[] };
    };
    expect(versioned.data.messages.at(-1)?.versionCount).toBe(2);
    const activated = await fetch(api + `/chat/${assistant.id}/activate`, { method: "PATCH" });
    expect(activated.status).toBe(200);
    const userId = detail.data.messages[0].id;
    const edited = await post(`/chat/${userId}/edit`, {
      question: "Updated question",
      sessionId,
      mode: "quick",
      answerMode: "general",
    });
    expect(await edited.text()).toContain("event: done");
    const fork = await post(`/chat/${sessionId}/fork`, { messageId: assistant.id });
    const result = (await fork.json()) as { data: { id: string; title: string } };
    expect(fork.status).toBe(201);
    expect(result.data.title).toMatch(/^Fork →/);
    const forked = (await (await fetch(api + `/chat/${result.data.id}/details`)).json()) as {
      data: { messages: unknown[] };
    };
    expect(forked.data.messages.length).toBe(2);
  });

  test("frontend SSE reader consumes NestJS event and token frames", async () => {
    const previousUrl = axiosInstance.defaults.baseURL;
    axiosInstance.defaults.baseURL = api;
    setAccessToken("mock-access-token");
    try {
      let tokens = "";
      const done = await postSse(
        "/chat/send",
        {
          question: "How does the reader work?",
          answerMode: "general",
          mode: "quick",
        },
        (event) => {
          if (event.type === "token") tokens += event.data.content;
        },
      );
      expect(done.status).toBe("completed");
      expect(tokens).toBe(done.content);
      expect(done.sessionId).toBeTruthy();
    } finally {
      axiosInstance.defaults.baseURL = previousUrl;
      setAccessToken(null);
    }
  });

  test("mock mutations can be persisted to browser storage", () => {
    const original = globalThis.localStorage;
    const saved = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        setItem: (key: string, value: string) => saved.set(key, value),
        getItem: (key: string) => saved.get(key),
      },
      configurable: true,
    });
    persistStore();
    const snapshot = [...saved.values()][0];
    expect(JSON.parse(snapshot).sessions.length).toBe(store.sessions.length);
    Object.defineProperty(globalThis, "localStorage", { value: original, configurable: true });
  });
});
