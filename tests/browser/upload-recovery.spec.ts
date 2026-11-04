import { expect, test } from "./fixtures";

test("PDF processing survives refresh and is attached only after READY", async ({ page }) => {
  const id = `recover-${crypto.randomUUID()}`;
  await page.goto("/");
  await page.getByRole("textbox", { name: "Your message" }).fill("Summarize this PDF");

  // Seed a queued worker job that will take longer than the old fixed polling window.
  await page.evaluate((documentId) => {
    const ownerId = "00000000-0000-4000-8000-000000000001";
    const workspaceKey = `chat-with-pdf:demo-workspace:v3:${ownerId}`;
    const workspace = JSON.parse(localStorage.getItem(workspaceKey) || "{}");
    const now = new Date().toISOString();
    workspace.sessions = workspace.sessions || [];
    workspace.messages = workspace.messages || [];
    workspace.documents = workspace.documents || [];
    workspace.documents.unshift({
      id: documentId,
      name: "slow.pdf",
      description: "PDF document",
      pages: 1,
      size: "1 MB",
      status: "QUEUED",
      analyzed: false,
      accent: "blue",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    workspace.uploadRecords = workspace.uploadRecords || {};
    workspace.uploadRecords[documentId] = {
      uploaded: true,
      processingAt: Date.now() + 180_000,
    };
    localStorage.setItem(workspaceKey, JSON.stringify(workspace));
    localStorage.setItem(
      `chat-with-pdf:pending-uploads:v1:${ownerId}`,
      JSON.stringify([{ id: documentId, name: "slow.pdf", scope: "new", queuedAt: Date.now() }]),
    );
  }, id);

  await page.reload();
  await expect(page.getByText("Processing…", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();

  // The browser reloads again after the backend worker reaches READY.
  await page.evaluate((documentId) => {
    const workspaceKey = "chat-with-pdf:demo-workspace:v3:00000000-0000-4000-8000-000000000001";
    const workspace = JSON.parse(localStorage.getItem(workspaceKey)!);
    workspace.uploadRecords[documentId].processingAt = Date.now() - 1_000;
    localStorage.setItem(workspaceKey, JSON.stringify(workspace));
  }, id);
  await page.reload();
  await expect(page.getByLabel("Attached documents")).toContainText("slow.pdf");
  await expect(page.getByText("Processing…", { exact: true })).toBeHidden();
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
});
