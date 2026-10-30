import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { server } from "../mocks/server";

const api = "http://localhost:3030/api";
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("MSW API contracts", () => {
  test("fork copies history through a selected message without mutating its source", async () => {
    const before = await fetch(`${api}/sessions/session-1/chats`);
    const original = (await before.json() as { data: { id: string }[] }).data;
    const result = await fetch(`${api}/sessions/session-1/fork`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: original[0].id }),
    });
    expect(result.status).toBe(201);
    const session = (await result.json() as { data: { id: string; forkedFromSessionId: string } }).data;
    expect(session.forkedFromSessionId).toBe("session-1");
    const forked = (await (await fetch(`${api}/sessions/${session.id}/chats`)).json() as { data: { id: string }[] }).data;
    expect(forked.length).toBe(1);
    expect(forked[0].id).not.toBe(original[0].id);
    const unchanged = (await (await fetch(`${api}/sessions/session-1/chats`)).json() as { data: { id: string }[] }).data;
    expect(unchanged.map(x => x.id)).toEqual(original.map(x => x.id));
  });

  test("regenerate changes only the selected assistant answer and increments revision", async () => {
    const original = (await (await fetch(`${api}/sessions/session-1/chats`)).json() as {
      data: { id: string; role: string; content: string }[];
    }).data;
    const target = original.find((message) => message.role === "assistant")!;
    const response = await fetch(`${api}/messages/${target.id}/regenerate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "document", thinkingMode: "pro" }),
    });
    expect(response.status).toBe(200);
    const updated = (await response.json() as { data: { id: string; content: string; regenerationCount: number } }).data;
    expect(updated.id).toBe(target.id);
    expect(updated.content).not.toBe(target.content);
    expect(updated.regenerationCount).toBeGreaterThanOrEqual(1);
    const after = (await (await fetch(`${api}/sessions/session-1/chats`)).json() as {
      data: { id: string; role: string; content: string }[];
    }).data;
    expect(after.length).toBe(original.length);
    expect(after.find(x => x.role === "user")?.content).toBe(original.find(x => x.role === "user")?.content);
  });

  test("document pagination and sorting return a consistent paging envelope", async () => {
    const response = await fetch(`${api}/documents?page=1&pageSize=6&sort=name&direction=asc`);
    expect(response.status).toBe(200);
    const result = await response.json() as { data: { name: string }[]; paging: { totalItems: number; totalPages: number } };
    expect(result.data.length).toBe(6);
    expect(result.paging.totalItems).toBe(12);
    expect(result.paging.totalPages).toBe(2);
    expect(result.data[0].name.localeCompare(result.data[1].name)).toBeLessThanOrEqual(0);
  });

  test("deleted chats and documents are queried independently", async () => {
    const [chats, docs] = await Promise.all([
      fetch(`${api}/sessions?deleted=true`),
      fetch(`${api}/documents?deleted=true&page=2&pageSize=4`),
    ]);
    expect(chats.status).toBe(200);
    expect(docs.status).toBe(200);
    const chatResult = await chats.json() as { data: unknown[] };
    const docResult = await docs.json() as { data: unknown[]; paging: { currentPage: number } };
    expect(chatResult.data.length).toBeGreaterThan(0);
    expect(docResult.paging.currentPage).toBe(2);
    expect(docResult.data.length).toBe(1);
  });

  test("thinking mode is accepted independently of answer mode", async () => {
    for (const thinkingMode of ["quick", "pro", "ultra"]) {
      const form = new FormData();
      form.append("message", "Test " + thinkingMode);
      form.append("mode", "general");
      form.append("thinkingMode", thinkingMode);
      form.append("documentIds", "[]");
      const response = await fetch(`${api}/chats`, { method: "POST", body: form });
      expect(response.status).toBe(201);
    }
    const invalid = new FormData();
    invalid.append("message", "invalid mode");
    invalid.append("thinkingMode", "nonexistent");
    expect((await fetch(`${api}/chats`, { method: "POST", body: invalid })).status).toBe(400);
  });

  test("chat send, soft delete, and restore preserve the session", async () => {
    const form = new FormData();
    form.append("message", "Summarize the annual report");
    form.append("mode", "document");
    form.append("documentIds", JSON.stringify(["doc-1"]));
    const sent = await fetch(`${api}/chats`, { method: "POST", body: form });
    expect(sent.status).toBe(201);
    const result = await sent.json() as { data: { session: { id: string }; messages: unknown[] } };
    expect(result.data.messages.length).toBe(2);
    const id = result.data.session.id;
    expect((await fetch(`${api}/sessions/${id}`, { method: "DELETE" })).status).toBe(204);
    expect((await fetch(`${api}/sessions/${id}`)).status).toBe(404);
    expect((await fetch(`${api}/sessions/${id}/restore`, { method: "POST" })).status).toBe(200);
    expect((await fetch(`${api}/sessions/${id}`)).status).toBe(200);
  });

  test("presigned PUT and process cannot be skipped", async () => {
    const res = await fetch(api + "/documents/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: "Upload contract.pdf" }),
    });
    expect(res.status).toBe(201);
    const payload = await res.json() as { data: { document_id: string; upload_url: string } };
    const id = payload.data.document_id;
    expect((await fetch(api + "/documents/" + id + "/process", { method: "POST" })).status).toBe(409);
    const uploaded = await fetch("http://localhost:3030" + payload.data.upload_url, {
      method: "PUT", headers: { "Content-Type": "application/pdf" },
      body: new Blob(["%PDF-1.4 mock"], { type: "application/pdf" }),
    });
    expect(uploaded.status).toBe(200);
    expect((await fetch(api + "/documents/" + id + "/process", { method: "POST" })).status).toBe(200);
    const mid = await fetch(api + "/documents/" + id);
    const intermediate = await mid.json() as { data: { status: string } };
    expect(["QUEUED", "PROCESSING"]).toContain(intermediate.data.status);
    await new Promise(resolve => setTimeout(resolve, 900));
    const ready = await fetch(api + "/documents/" + id);
    expect((await ready.json() as { data: { status: string } }).data.status).toBe("READY");
  });

});
