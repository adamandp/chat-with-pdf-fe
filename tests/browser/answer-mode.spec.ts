import { expect, test } from "./fixtures";

test("new chat defaults to general and requires an attached PDF for document-only", async ({
  page,
}) => {
  await page.goto("/");
  const modeTrigger = page.getByRole("button", { name: "Answer Mode" });
  await expect(modeTrigger).toHaveAttribute("title", /General Knowledge/);

  await modeTrigger.click();
  const documentOnly = page.getByRole("button", { name: /Document Only/ });
  await expect(documentOnly).toBeDisabled();
  await expect(documentOnly).toContainText("Attach a PDF to enable");

  await modeTrigger.click();
  await page.getByRole("button", { name: "Attach a document" }).click();
  await page.getByRole("button", { name: /Choose from Library/ }).click();
  const firstDocument = page.locator(".library-item").first();
  await expect(firstDocument).toBeVisible();
  await firstDocument.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Done" }).click();

  await expect(modeTrigger).toHaveAttribute("title", /General Knowledge/);
  await modeTrigger.click();
  await expect(documentOnly).toBeEnabled();
  await documentOnly.click();
  await expect(modeTrigger).toHaveAttribute("title", /Document Only/);

  await page
    .locator(".composer-documents")
    .getByRole("button", { name: /Remove/ })
    .click();
  await expect(modeTrigger).toHaveAttribute("title", /General Knowledge/);
  await modeTrigger.click();
  await expect(documentOnly).toBeDisabled();
});

test("existing chat with attached PDFs keeps its saved document-only mode", async ({ page }) => {
  await page.goto("/chats/session-1");
  const modeTrigger = page.getByRole("button", { name: "Answer Mode" });
  await expect(modeTrigger).toHaveAttribute("title", /Document Only/);
  await modeTrigger.click();
  await expect(page.getByRole("button", { name: /Document Only/ })).toBeEnabled();
});
