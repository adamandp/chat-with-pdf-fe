import { expect, test } from "@playwright/test";

test("anonymous Documents and Trash render empty states without fetching", async ({ page }) => {
  const workspaceRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(documents|chat-sessions)(\/|\?|$)/.test(request.url())) {
      workspaceRequests.push(request.url());
    }
  });

  await page.goto("/documents");
  await expect(page.getByText("Your library is empty")).toBeVisible();
  await expect(page.getByText("Loading documents...")).toHaveCount(0);

  await page.goto("/trash");
  await expect(page.getByText("No deleted chats.")).toBeVisible();
  await expect(page.getByText("No deleted documents.")).toBeVisible();
  expect(workspaceRequests).toHaveLength(0);
});

test("a protected chat link does not trap an anonymous visitor in loading", async ({ page }) => {
  await page.goto("/chats/00000000-0000-4000-8000-000000000001");
  await expect(
    page.getByText(/Sign in from Account settings to view this conversation/),
  ).toBeVisible();
  await expect(page.getByText("Loading conversation...")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Chat composer" })).toHaveCount(0);
});
