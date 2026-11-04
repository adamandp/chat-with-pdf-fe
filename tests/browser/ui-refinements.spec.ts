import { expect, test } from "./fixtures";

test("brand links return to New Chat without creating a session", async ({ page }) => {
  await page.goto("/documents");
  await page.getByRole("link", { name: "Chat with PDF — New Chat" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Your documents, explained." })).toBeVisible();

  await page.setViewportSize({ width: 768, height: 850 });
  await page.goto("/trash");
  await page.getByRole("link", { name: "Chat with PDF — New Chat" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/documents");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .locator("aside.sidebar")
    .getByRole("link", { name: "Chat with PDF — New Chat" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("aside.sidebar")).not.toHaveClass(/mobile-visible/);
});

test("medium-width sidebar search stays inside one flex field", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 850 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const search = page.getByRole("textbox", { name: "Search recent chats" });
  await expect(search).toBeVisible();
  const geometry = await page.locator(".sidebar-search").evaluate((node) => {
    const field = node.getBoundingClientRect();
    const input = node.querySelector("input")!.getBoundingClientRect();
    return {
      display: getComputedStyle(node).display,
      inside: input.left >= field.left && input.right <= field.right,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    };
  });
  expect(geometry.display).toBe("flex");
  expect(geometry.inside).toBe(true);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  await search.fill("Annual");
  await expect(search).toHaveValue("Annual");
  await page.screenshot({ path: "test-results/medium-sidebar-search.png" });
});

test("library Done and trash/document action menus use the new neo style", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Attach a document" }).click();
  await page.getByText("Choose from Library", { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Choose from Library" });
  const done = dialog.getByRole("button", { name: "Done" });
  await expect(done).toHaveClass(/neo-button/);
  await done.click();
  await expect(dialog).toBeHidden();

  await page.goto("/documents");
  await page
    .getByRole("button", { name: /Actions for/ })
    .first()
    .click();
  await expect(page.getByRole("menuitem", { name: "Preview" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Move to Trash" })).toBeVisible();

  await page.goto("/trash");
  await page
    .getByRole("button", { name: /Actions for/ })
    .first()
    .click();
  await expect(page.getByRole("menuitem", { name: "Restore" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: "Delete permanently?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("account popup shows identity but never User ID", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Account settings" }).click();
  const popup = page.locator(".account-popover");
  await expect(popup.getByText("ACCOUNT INFO")).toBeVisible();
  await expect(popup.getByText("Full name")).toBeVisible();
  await expect(popup.getByText("Username")).toBeVisible();
  await expect(popup.getByText("User ID")).toHaveCount(0);
  await expect(popup.getByRole("button", { name: "Log out", exact: true })).toBeVisible();
  await popup.getByRole("switch", { name: "Dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: "test-results/account-popup-dark.png" });
});
