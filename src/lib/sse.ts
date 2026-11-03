import { authenticatedFetch } from "@/lib/axios";

export type StreamEvent =
  | { type: "started"; data: { id: string; sessionId: string; status: string } }
  | { type: "sources"; data: { sources: { documentId: string; pageNumber: number }[] } }
  | { type: "token"; data: { content: string } }
  | {
      type: "done";
      data: {
        id: string;
        sessionId: string;
        content: string;
        status: string;
        sources: { documentId: string; pageNumber: number }[];
        mode: string;
      };
    }
  | { type: "error"; data: { messageId: string; message: string } };

/** NestJS @Sse POST responses use event/data lines separated by an empty line. */
export async function postSse(
  path: string,
  body: object,
  onEvent?: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<Extract<StreamEvent, { type: "done" }>["data"]> {
  const response = await authenticatedFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
    headers: { Accept: "text/event-stream" },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || `Chat request failed (${response.status})`);
  }
  if (!response.body) throw new Error("The server did not return an event stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: Extract<StreamEvent, { type: "done" }>["data"] | null = null;

  function dispatch(frame: string) {
    const lines = frame.split("\n");
    const name = lines
      .find((line) => line.startsWith("event:"))
      ?.slice(6)
      .trim();
    const value = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!name || !value) return;
    const event = { type: name, data: JSON.parse(value) } as StreamEvent;
    if (event.type === "error") throw new Error(event.data.message);
    if (event.type === "done") completed = event.data;
    onEvent?.(event);
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        dispatch(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
      }
      if (done) break;
    }
    if (buffer.trim()) dispatch(buffer);
    if (!completed) throw new Error("Chat stream ended before the answer was completed");
    return completed;
  } finally {
    reader.releaseLock();
  }
}
