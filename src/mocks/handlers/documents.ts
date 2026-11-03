import { delay, http, HttpResponse } from "msw";
import type { PdfDocument } from "@/interface/document.interface";
import { paginate, persistStore, store } from "../data/store";

function dto(document: PdfDocument, details = false) {
  return {
    id: document.id,
    fileName: document.name,
    fileSize: String(Math.round((Number.parseFloat(document.size) || 0) * 1048576)),
    pageCount: document.pages,
    chunkCount: 8,
    mimeType: "application/pdf",
    status: document.status || "READY",
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    deletedAt: document.deletedAt,
    ...(details ? { download_url: document.url || null } : {}),
  };
}

export const documentHandlers = [
  http.post("*/api/document-upload/presigned-url", async ({ request }) => {
    await delay(150);
    const payload = (await request.json()) as { fileName?: string };
    if (!payload.fileName?.toLowerCase().endsWith(".pdf"))
      return HttpResponse.json({ message: "PDF file name required" }, { status: 400 });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    store.uploadRecords.set(id, { uploaded: false, processingAt: null });
    store.documents.unshift({
      id,
      name: payload.fileName,
      description: "Uploaded PDF document",
      pages: 1,
      size: "0 MB",
      accent: "blue",
      analyzed: false,
      status: "PENDING_UPLOAD",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    persistStore();
    return HttpResponse.json(
      { data: { document_id: id, upload_url: `/mock-storage/${id}`, expires_in: 900 } },
      { status: 201 },
    );
  }),
  http.put("*/mock-storage/:id", async ({ params, request }) => {
    const id = String(params.id);
    const record = store.uploadRecords.get(id);
    if (!record) return HttpResponse.json({ message: "Unknown upload" }, { status: 404 });
    const blob = await request.blob();
    if (!blob.size) return HttpResponse.json({ message: "Empty PDF" }, { status: 400 });
    record.uploaded = true;
    const document = store.documents.find((item) => item.id === id);
    if (document) document.size = `${(blob.size / 1048576).toFixed(2)} MB`;
    persistStore();
    return new HttpResponse(null, { status: 200 });
  }),
  http.post("*/api/document-upload/:id/process", ({ params }) => {
    const id = String(params.id);
    const record = store.uploadRecords.get(id);
    if (!record?.uploaded)
      return HttpResponse.json({ message: "Upload not finished" }, { status: 409 });
    record.processingAt = Date.now();
    const document = store.documents.find((item) => item.id === id);
    if (document) document.status = "QUEUED";
    persistStore();
    return HttpResponse.json({ message: "Queued", data: { id, status: "QUEUED" } });
  }),
  http.get("*/api/documents", async ({ request }) => {
    await delay(100);
    const params = new URL(request.url).searchParams;
    const q = (params.get("q") || "").toLowerCase();
    const direction = params.get("order") === "asc" ? 1 : -1;
    const sort = params.get("sort") || "modified";
    const documents = store.documents
      .filter(
        (document) =>
          !document.deletedAt &&
          (document.status || "READY") === "READY" &&
          document.name.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sort === "name") return direction * a.name.localeCompare(b.name);
        if (sort === "pages") return direction * (a.pages - b.pages);
        return direction * a.updatedAt.localeCompare(b.updatedAt);
      });
    const result = paginate(
      documents.map((document) => dto(document)),
      Number(params.get("page") || 1),
      Number(params.get("limit") || 10),
    );
    return HttpResponse.json({ message: "Documents retrieved", ...result });
  }),
  http.get("*/api/documents/deleted", async ({ request }) => {
    const params = new URL(request.url).searchParams;
    const documents = store.documents
      .filter((document) => Boolean(document.deletedAt) && (document.status || "READY") === "READY")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((document) => dto(document));
    return HttpResponse.json({
      message: "Deleted documents retrieved",
      ...paginate(documents, Number(params.get("page") || 1), Number(params.get("limit") || 10)),
    });
  }),
  http.get("*/api/documents/:id", ({ params }) => {
    const document = store.documents.find(
      (item) => item.id === params.id && !item.deletedAt && item.status !== "DELETED",
    );
    if (!document) return HttpResponse.json({ message: "Document not found" }, { status: 404 });
    const record = store.uploadRecords.get(document.id);
    if (record?.processingAt) {
      document.status = Date.now() - record.processingAt > 800 ? "READY" : "PROCESSING";
      document.analyzed = document.status === "READY";
      persistStore();
    }
    return HttpResponse.json({ data: dto(document, true) });
  }),
  http.delete("*/api/documents/:id/permanent", ({ params }) => {
    const document = store.documents.find((item) => item.id === params.id && item.deletedAt);
    if (!document)
      return HttpResponse.json({ message: "Deleted document not found" }, { status: 404 });
    // Preserve the row and chat relationships; only the physical content is gone.
    document.status = "DELETED";
    document.url = undefined;
    document.updatedAt = new Date().toISOString();
    store.uploadRecords.delete(document.id);
    persistStore();
    return HttpResponse.json({ message: "Document permanently deleted", data: dto(document) });
  }),
  http.delete("*/api/documents/:id", ({ params }) => {
    const document = store.documents.find(
      (item) => item.id === params.id && !item.deletedAt && (item.status || "READY") === "READY",
    );
    if (!document)
      return HttpResponse.json({ message: "Ready document not found" }, { status: 404 });
    document.deletedAt = new Date().toISOString();
    persistStore();
    return HttpResponse.json({ message: "Document moved to Trash", data: dto(document) });
  }),
  http.post("*/api/documents/:id/restore", ({ params }) => {
    const document = store.documents.find(
      (item) => item.id === params.id && item.deletedAt && (item.status || "READY") === "READY",
    );
    if (!document)
      return HttpResponse.json({ message: "Deleted document not found" }, { status: 404 });
    document.deletedAt = null;
    document.updatedAt = new Date().toISOString();
    persistStore();
    return HttpResponse.json({ message: "Document restored", data: dto(document) });
  }),
];
