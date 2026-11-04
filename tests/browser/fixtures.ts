import { test as base, expect } from "@playwright/test";

/** Every browser test starts with the same authenticated MSW demo identity. */
export const test = base.extend<{ authenticated: void }>({
  authenticated: [
    async ({ page }, use) => {
      await page.goto("/");
      const mobileNavigation = page.getByRole("button", { name: "Open navigation" });
      const isMobile = (page.viewportSize()?.width ?? 1280) <= 850;
      if (isMobile) {
        await expect(mobileNavigation).toBeVisible();
        await mobileNavigation.click();
        await expect(page.getByRole("complementary", { name: "Main navigation" })).toHaveClass(
          /mobile-visible/,
        );
      }
      await page.getByRole("button", { name: "Account settings" }).click();
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await page.getByRole("textbox", { name: "Username" }).fill("demo");
      await page.getByLabel("Password").fill("demo12345");
      await page.getByRole("button", { name: "Login", exact: true }).click();
      await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible();
      if (isMobile) {
        await page
          .getByRole("complementary", { name: "Main navigation" })
          .getByRole("button", { name: "Close navigation" })
          .click();
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect };
