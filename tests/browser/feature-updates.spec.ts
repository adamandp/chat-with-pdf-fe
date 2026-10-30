import { expect, test } from "@playwright/test";

test("fork from assistant produces independent chat history", async ({ page }) => {
  await page.goto("/chats/session-1");
  await expect(page.locator(".message-line")).toHaveCount(2);
  const sourceMessages = await page.locator(".message-line").count();
  await page.getByRole("button", { name: "Fork chat from this message" }).last().click();
  await expect(page).toHaveURL(/\/chats\/(?!session-1)[a-z0-9-]+$/i);
  await expect(page.locator(".chat-banner")).toContainText("Fork: Q3 Financial Summary");
  await expect(page.locator(".message-line")).toHaveCount(sourceMessages);
  await page.goto("/chats/session-1");
  await expect(page.locator(".message-line")).toHaveCount(sourceMessages);
});

test("fork from user message copies only history up to that point", async ({ page }) => {
  await page.goto("/chats/session-1");
  await page.getByRole("button", { name: "Fork chat from this message" }).first().click();
  await expect(page).toHaveURL(/\/chats\/(?!session-1)[a-z0-9-]+$/i);
  await expect(page.locator(".message-line")).toHaveCount(1);
  await expect(page.locator(".message-line.user")).toHaveCount(1);
});

test("regenerate updates selected answer rather than adding a duplicate", async ({ page }) => {
  await page.goto("/chats/session-1");
  const messages = page.locator(".message-line");
  await expect(messages).toHaveCount(2);
  await page.getByRole("button", { name: "Regenerate answer" }).click();
  await expect(page.getByText("Regenerated 1", { exact: false })).toBeVisible();
  await expect(page.getByText("Regenerated demo response #1", { exact: false })).toBeVisible();
  await expect(messages).toHaveCount(2);
  await page.getByRole("button", { name: "Regenerate answer" }).click();
  await expect(page.getByText("Regenerated 2", { exact: false })).toBeVisible();
  await expect(messages).toHaveCount(2);
});

test("compact pagination controls retain expected navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/documents");
  const pagination = page.getByRole("navigation", { name: "Document pages" });
  await expect(pagination).toBeVisible();
  await expect(pagination.locator("select")).toHaveCount(0);
  await pagination.getByRole("button", { name: "Rows per page" }).click();
  await page.getByRole("button", { name: "Show 4 rows per page" }).click();
  await expect(page.locator(".document-card")).toHaveCount(4);
  await expect(pagination).toContainText("Showing 1–4 of 12");
  await pagination.getByRole("button", { name: "Last page" }).click();
  await expect(pagination).toContainText("Page 3 / 3");
  await pagination.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/pagination-compact.png" });
});

test("navy dark theme keeps accent colors and usable popup", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chats/session-1");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Account settings" }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const color = await page.locator(".mobile-topbar").evaluate(element => getComputedStyle(element).backgroundColor);
  expect(color).toBe("rgb(38, 46, 61)");
  await page.getByRole("complementary", { name: "Main navigation" }).getByRole("button", { name: "Close navigation" }).click();
  await expect.poll(async () => {
    const box = await page.locator(".composer").boundingBox();
    return box ? box.x + box.width : 999;
  }).toBeLessThanOrEqual(391);
  await page.getByRole("button", { name: "Attach a document" }).click();
  await expect(page.getByText("Upload New PDF")).toBeVisible();
  await page.screenshot({ path: "test-results/dark-attachment.png" });
  await page.locator(".chat-banner").click({ position: { x: 5, y: 5 } });
  await expect(page.getByText("Upload New PDF")).toBeHidden();
  await page.getByRole("textbox", { name: "Your message" }).fill("Must remain clickable");
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
});

test("rename from sidebar dropdown remains tappable after cancel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chats/session-1");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Chat actions for Q3 Financial Summary" }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".neo-dialog-compact [data-slot='dialog-footer'] .neo-button")).toHaveCount(2);
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("complementary", { name: "Main navigation" }).getByRole("button", { name: "Close navigation" }).click();
  await page.getByRole("button", { name: "Thinking Mode" }).click();
  await expect(page.getByText("Ultra", { exact: true })).toBeVisible();
});
