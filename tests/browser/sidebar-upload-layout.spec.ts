import { expect, test } from "@playwright/test";

test("desktop sidebar collapses into rail and account switch stays usable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/documents");
  const sidebar = page.getByRole("complementary", { name: "Main navigation" });
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(sidebar).toHaveClass(/desktop-collapsed/);
  await expect.poll(async () => (await sidebar.boundingBox())?.width ?? 999).toBeLessThanOrEqual(80);
  await expect(page.getByRole("link", { name: "Documents" })).toBeVisible();
  await page.getByRole("button", { name: "Account settings" }).click();
  const theme = page.getByRole("switch", { name: "Dark mode" });
  await expect(theme).toBeVisible();
  await theme.click();
  await expect(theme).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Account settings" }).click();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(sidebar).not.toHaveClass(/desktop-collapsed/);
  await page.screenshot({ path: "test-results/sidebar-expanded-dark.png" });
});

test("document attachment pipeline blocks send until processing is ready", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const textbox = page.getByRole("textbox", { name: "Your message" });
  await textbox.fill("Summarize the uploaded report");
  await page.getByLabel("Upload a PDF").setInputFiles("public/pdfs/Annual Report 2023.pdf");
  await expect(page.getByRole("status").filter({ hasText: "Annual Report 2023.pdf" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();
  await expect(textbox).toHaveValue("Summarize the uploaded report");
  await page.screenshot({ path: "test-results/upload-processing.png" });
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled({ timeout: 20000 });
  await expect(page.getByRole("status").filter({ hasText: "Annual Report 2023.pdf" })).toBeHidden();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page).toHaveURL(/\/chats\/[0-9a-f-]+$/);
});

test("dark mode document popup has legible menu actions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/chats/session-1");
  await page.getByRole("button", { name: "Account settings" }).click();
  await page.getByRole("switch", { name: "Dark mode" }).click();
  await page.getByRole("button", { name: "Account settings" }).click();
  await page.getByRole("button", { name: "Attach a document" }).click();
  const action = page.getByText("Choose from Library", { exact: true });
  await expect(action).toBeVisible();
  const styles = await action.evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node.closest(".composer-popover-action")!).backgroundColor }));
  expect(styles.color).not.toEqual(styles.background);
  await page.screenshot({ path: "test-results/attachment-popup-dark.png" });
});

for (const pathname of ["/", "/chats/session-1", "/documents", "/trash"]) {
  test("visible right and bottom spacing: " + pathname, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(pathname);
    if (pathname === "/" || pathname.startsWith("/chats")) {
      const composer = page.locator(".composer");
      await expect(composer).toBeVisible();
      const gap = await page.evaluate(() => {
        const main = document.querySelector(".workspace-main")!.getBoundingClientRect();
        const composer = document.querySelector(".composer")!.getBoundingClientRect();
        return { right: main.right - composer.right, bottom: main.bottom - composer.bottom };
      });
      expect(gap.right).toBeGreaterThanOrEqual(5);
      expect(gap.bottom).toBeGreaterThanOrEqual(5);
    } else {
      const main = page.locator(".workspace-main");
      await main.evaluate(node => { node.scrollTop = node.scrollHeight; });
      const gap = await main.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight);
      expect(gap).toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: "test-results/layout-" + pathname.replaceAll("/", "-") + ".png" });
  });
}
