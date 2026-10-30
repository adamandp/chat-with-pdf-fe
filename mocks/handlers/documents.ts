import { delay, http, HttpResponse } from "msw";
import type { PdfDocument } from "@/features/common/types";
import { paginate, store } from "../data/store";

export const documentHandlers = [
  http.get("*/api/documents", async ({ request }) => {
    await delay(160);
    const params = new URL(request.url).searchParams;
    const deleted = params.get("deleted") === "true";
    const query = (params.get("q") || "").toLowerCase();
    const sort = params.get("sort") || "modified";
    const direction = params.get("direction") === "asc" ? 1 : -1;
    const result = store.documents.filter((doc) => Boolean(doc.deletedAt) === deleted && doc.name.toLowerCase().includes(query));
    result.sort((a, b) => {
      if (sort === "name") return direction * a.name.localeCompare(b.name);
      if (sort === "pages") return direction * (a.pages - b.pages);
      return direction * (a.updatedAt.localeCompare(b.updatedAt));
    });
    return HttpResponse.json(paginate(result, Number(params.get("page") || 1), Number(params.get("pageSize") || 6)));
  }),
  http.get("*/api/documents/:id", ({ params }) => {
    const doc = store.documents.find((item) => item.id === params.id && !item.deletedAt);
    return doc ? HttpResponse.json({ data: doc }) : HttpResponse.json({ message: "Document not found" }, { status: 404 });
  }),
  http.post("*/api/documents", async ({ request }) => {
    const payload = await request.formData();
    const file = payload.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf")
      return HttpResponse.json({ message: "Only PDF files are supported" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024)
      return HttpResponse.json({ message: "PDF must be under 20 MB" }, { status: 400 });
    const now = new Date().toISOString();
    const document: PdfDocument = {
      id: crypto.randomUUID(), name: file.name, description: "Uploaded PDF document", pages: 1,
      size: `${(file.size / 1048576).toFixed(2)} MB`, accent: "blue", analyzed: false,
      createdAt: now, updatedAt: now, deletedAt: null,
    };
    store.documents.unshift(document);
    return HttpResponse.json({ data: document }, { status: 201 });
  }),
  http.delete("*/api/documents/:id", ({ params, request }) => {
    const index = store.documents.findIndex((item) => item.id === params.id);
    if (index < 0) return HttpResponse.json({ message: "Document not found" }, { status: 404 });
    const permanent = new URL(request.url).searchParams.get("permanent") === "true";
    if (permanent) {
      store.documents.splice(index, 1);
      for (const session of store.sessions) session.documentIds = session.documentIds.filter((id) => id !== params.id);
    } else store.documents[index].deletedAt = new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),
  http.post("*/api/documents/:id/restore", ({ params }) => {
    const doc = store.documents.find((item) => item.id === params.id && item.deletedAt);
    if (!doc) return HttpResponse.json({ message: "Deleted document not found" }, { status: 404 });
    doc.deletedAt = null;
    doc.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: doc });
  }),
];
