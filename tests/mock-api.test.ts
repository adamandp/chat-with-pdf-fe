import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { server } from "../mocks/server";

const api = "http://localhost:3030/api";
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("MSW API contracts", () => {
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
});
