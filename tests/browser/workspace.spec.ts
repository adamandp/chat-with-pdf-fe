import { expect, test } from "@playwright/test";

test("shared sidebar and real App Router navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible();
  await page.getByRole("link", { name: "Documents" }).click();
  await expect(page).toHaveURL(/\/documents$/);
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await expect(page.locator("aside.sidebar")).toHaveCount(1);
  await page.getByRole("link", { name: "Trash" }).click();
  await expect(page).toHaveURL(/\/trash$/);
  await expect(page.getByRole("heading", { name: "Chat History" })).toBeVisible();
});

test("documents grid/list, search, and pagination", async ({ page }) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: "List View" }).click();
  await expect(page.locator(".document-row")).toHaveCount(6);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator(".document-row")).toHaveCount(6);
  await page.getByRole("textbox", { name: "Search documents" }).fill("Annual Report");
  await expect(page.locator(".document-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Grid View" }).click();
  await expect(page.locator(".document-card")).toHaveCount(2);
});

test("source opens PDF preview and controls are usable", async ({ page }) => {
  await page.goto("/chats/session-1");
  await expect(page.getByText("Financial Performance", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Annual Report 2023.pdf Page 12" }).first().click();
  await expect(page.getByRole("region", { name: /PDF preview/ })).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByText("125%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close PDF preview" }).click();
});

test("mobile viewport does not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/documents");
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
