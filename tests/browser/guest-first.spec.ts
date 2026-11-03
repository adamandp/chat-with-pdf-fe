import { expect, test } from "@playwright/test";

test("visiting the workspace never creates a guest until first chat send", async ({ page }) => {
  const guestRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/guest")) guestRequests.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your documents, explained." })).toBeVisible();
  await page.getByRole("button", { name: "Account settings" }).click();
  await expect(page.locator(".account-popover")).toContainText("Guest User");
  await expect(page.locator(".account-popover")).toContainText("Not registered");
  await expect(guestRequests).toHaveLength(0);

  await page.getByRole("textbox", { name: "Your message" }).fill("Summarize this workspace");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page).toHaveURL(/\/chats\//);
  expect(guestRequests).toHaveLength(1);
});
