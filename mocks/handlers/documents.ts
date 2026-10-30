import { delay, http, HttpResponse } from "msw";
import { paginate, store } from "../data/store";

export const documentHandlers = [
  http.post("*/api/documents/presigned-url", async ({ request }) => {
    await delay(300);
    const payload = await request.json() as { fileName?: string };
    if (!payload.fileName?.toLowerCase().endsWith(".pdf"))
      return HttpResponse.json({ message: "PDF file name required" }, { status: 400 });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    store.uploadRecords.set(id, { uploaded: false, processingAt: null });
    store.documents.unshift({
      id, name: payload.fileName, description: "Uploaded PDF document", pages: 1,
      size: "0 MB", accent: "blue", analyzed: false, status: "PENDING_UPLOAD",
      createdAt: now, updatedAt: now, deletedAt: null,
    });
    return HttpResponse.json({
      data: { document_id: id, upload_url: `/mock-storage/${id}`, expires_in: 900 },
    }, { status: 201 });
  }),
  http.put("*/mock-storage/:id", async ({ params, request }) => {
    await delay(350);
    const id = String(params.id);
    const record = store.uploadRecords.get(id);
    if (!record) return HttpResponse.json({ message: "Unknown presigned upload" }, { status: 404 });
    const blob = await request.blob();
    if (!blob.size) return HttpResponse.json({ message: "Empty PDF" }, { status: 400 });
    record.uploaded = true;
    const doc = store.documents.find(item => item.id === id);
    if (doc) doc.size = `${(blob.size / 1048576).toFixed(2)} MB`;
    return new HttpResponse(null, { status: 200 });
  }),
  http.post("*/api/documents/:id/process", async ({ params }) => {
    await delay(240);
    const id = String(params.id);
    const record = store.uploadRecords.get(id);
    if (!record?.uploaded) return HttpResponse.json({ message: "File upload is not complete" }, { status: 409 });
    record.processingAt = Date.now();
    const doc = store.documents.find(item => item.id === id);
    if (doc) doc.status = "QUEUED";
    return HttpResponse.json({ message: "Document queued for processing", data: { id, status: "QUEUED" } });
  }),

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
    if (!doc) return HttpResponse.json({ message: "Document not found" }, { status: 404 });
    const record = store.uploadRecords.get(doc.id);
    if (record?.processingAt) {
      doc.status = Date.now() - record.processingAt > 850 ? "READY" : "PROCESSING";
      doc.analyzed = doc.status === "READY";
    }
    return HttpResponse.json({ data: doc });
  }),
  http.delete("*/api/documents/:id", ({ params, request }) => {
    const index = store.documents.findIndex((item) => item.id === params.id);
    if (index < 0) return HttpResponse.json({ message: "Document not found" }, { status: 404 });
    const permanent = new URL(request.url).searchParams.get("permanent") === "true";
    if (permanent) {
      store.documents.splice(index, 1);
      store.uploadRecords.delete(String(params.id));
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
