import { expect, test } from "@playwright/test";

test("session drafts remain independent through navigation and refresh", async ({ page }) => {
  await page.goto("/chats/session-1");
  await page.getByRole("textbox", { name: "Your message" }).fill("Analyze revenue differences");
  await expect(page.locator(".sidebar-session-row").filter({ hasText: "Q3 Financial Summary" }).getByRole("img", { name: "Unsent draft" })).toBeVisible();

  await page.getByRole("link", { name: /Compare annual reports/ }).click();
  await expect(page).toHaveURL(/chats\/session-2/);
  await page.getByRole("textbox", { name: "Your message" }).fill("Summarize PDF two");
  await page.getByRole("link", { name: /Q3 Financial Summary/ }).click();
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveValue("Analyze revenue differences");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveValue("Analyze revenue differences");
  await page.getByRole("link", { name: /Compare annual reports/ }).click();
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveValue("Summarize PDF two");
});

test("pin and unpin session persist across reload", async ({ page }) => {
  await page.goto("/");
  const row = page.locator(".sidebar-session-row").filter({ hasText: "Q3 Financial Summary" });
  await row.getByRole("button", { name: /Chat actions/ }).click();
  await page.getByRole("menuitem", { name: "Pin", exact: true }).click();
  await expect(row).toHaveClass(/is-pinned/);
  await page.reload();
  const pinned = page.locator(".sidebar-session-row").filter({ hasText: "Q3 Financial Summary" });
  await expect(pinned).toHaveClass(/is-pinned/);
  await pinned.getByRole("button", { name: /Chat actions/ }).click();
  await page.getByRole("menuitem", { name: "Unpin" }).click();
  await expect(pinned).not.toHaveClass(/is-pinned/);
});

test("theme selection persists across route changes and reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Account settings" }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator(".sidebar")).toHaveCSS("background-color", "rgb(24, 28, 36)");
  await page.getByRole("link", { name: "Documents" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("compact mobile composer, thinking controls and PDF preview", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chats/session-1");
  await expect(page.locator(".chat-main")).toBeVisible();
  const mode = page.getByRole("button", { name: "Answer Mode" });
  await expect(mode).toBeVisible();
  await expect(mode.locator(".composer-document-count")).toHaveText("3");
  await expect(page.locator(".composer-documents")).toBeHidden();
  await page.getByRole("button", { name: "Thinking Mode" }).click();
  await expect(page.getByText("Ultra", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Ultra Deep reasoning/i }).click();
  await expect(page.getByRole("button", { name: "Thinking Mode" })).toHaveAttribute("title", /ultra/);

  await page.getByRole("button", { name: "Annual Report 2023.pdf Page 12" }).first().click();
  await expect(page.getByRole("region", { name: /PDF preview/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand PDF preview" })).toBeHidden();
  const pageNumber = page.getByRole("spinbutton", { name: "PDF page number" });
  await expect(pageNumber).toBeVisible();
  const box = await pageNumber.boundingBox();
  expect(box?.width ?? 999).toBeLessThanOrEqual(40);
  await page.screenshot({ path: "test-results/mobile-pdf-compact.png" });
});

test("dark mobile drawer and composer remain in viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/chats/session-1");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Account settings" }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("complementary", { name: "Main navigation" }).getByRole("button", { name: "Close navigation" }).click();
  const geometry = await page.locator(".composer").evaluate(el => {
    const rect = el.getBoundingClientRect();
    return {left: rect.left, right: rect.right, viewport: document.documentElement.clientWidth};
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
  await page.screenshot({ path: "test-results/mobile-dark-composer.png" });
});
