import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { http, HttpResponse } from "msw";
import { server } from "../src/mocks/server";
import { axiosInstance } from "../src/lib/axios";
import { uploadDocument } from "../src/features/document-upload/document-upload.api";
import { checkUploadStatus } from "../src/features/document-upload/use-pending-uploads";
import {
  forgetPendingUploads,
  getPendingUploads,
  rememberPendingUpload,
} from "../src/features/document-upload/pending-uploads";

const originalBaseUrl = axiosInstance.defaults.baseURL;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  axiosInstance.defaults.baseURL = "http://localhost:3030/api";
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  axiosInstance.defaults.baseURL = originalBaseUrl;
  server.close();
});

describe("PDF processing recovery", () => {
  test("a successful enqueue resolves without polling or waiting 120 seconds", async () => {
    let statusRequests = 0;
    server.use(
      http.post("*/api/document-upload/presigned-url", () =>
        HttpResponse.json({
          data: {
            document_id: "slow-id",
            upload_url: "http://localhost:3030/mock-storage/slow-id",
            expires_in: 900,
          },
        }),
      ),
      http.put("*/mock-storage/slow-id", () => new HttpResponse(null, { status: 200 })),
      http.post("*/api/document-upload/slow-id/process", () =>
        HttpResponse.json({ data: { id: "slow-id", status: "QUEUED" } }),
      ),
      http.get("*/api/documents/slow-id", () => {
        statusRequests++;
        return HttpResponse.json({ data: { status: "PROCESSING" } });
      }),
    );

    const queued = await uploadDocument({
      file: new File(["%PDF-1.4"], "slow.pdf", { type: "application/pdf" }),
    });
    expect(queued).toEqual({ id: "slow-id", name: "slow.pdf" });
    expect(statusRequests).toBe(0);
  });

  test("network failures remain pending, only READY and FAILED are terminal", async () => {
    let status: "PROCESSING" | "READY" | "FAILED" = "PROCESSING";
    let offline = false;
    server.use(
      http.get("*/api/documents/slow-id", () => {
        if (offline) return HttpResponse.error();
        return HttpResponse.json({ data: { id: "slow-id", status } });
      }),
    );

    expect(await checkUploadStatus("slow-id")).toBe("PENDING");
    offline = true;
    expect(await checkUploadStatus("slow-id")).toBe("PENDING");
    offline = false;
    status = "READY";
    expect(await checkUploadStatus("slow-id")).toBe("READY");
    status = "FAILED";
    expect(await checkUploadStatus("slow-id")).toBe("FAILED");
  });

  test("pending jobs are isolated by account and chat until completion", () => {
    const ownerA = `test-owner-a-${crypto.randomUUID()}`;
    const ownerB = `test-owner-b-${crypto.randomUUID()}`;
    rememberPendingUpload(ownerA, {
      id: "document-1",
      name: "slow.pdf",
      scope: "new",
      queuedAt: Date.now(),
    });
    expect(getPendingUploads(ownerA).map((item) => item.id)).toEqual(["document-1"]);
    expect(getPendingUploads(ownerB)).toEqual([]);
    expect(getPendingUploads(ownerA).filter((item) => item.scope === "another-chat")).toEqual([]);
    forgetPendingUploads(ownerA, ["document-1"]);
    expect(getPendingUploads(ownerA)).toEqual([]);
  });
});
