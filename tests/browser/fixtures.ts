import { test as base, expect } from "@playwright/test";

/** Every browser test starts with the same authenticated MSW demo identity. */
export const test = base.extend<{ authenticated: void }>({
  authenticated: [
    async ({ page }, use) => {
      await page.goto("/");
      await page.getByRole("textbox", { name: "Username" }).fill("demo");
      await page.getByLabel("Password").fill("demo12345");
      await page.getByRole("button", { name: "Login", exact: true }).click();
      await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible();
      await use();
    },
    { auto: true },
  ],
});

export { expect };
