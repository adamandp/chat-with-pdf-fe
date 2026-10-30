import { expect, test } from "@playwright/test";

for (const width of [320, 375, 390, 430, 768, 1280]) {
  test(`chat layout stays inside the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/chats/session-1");
    await expect(page.locator(".message-line").first()).toBeVisible();
    const geometry = await page.evaluate(() => {
      const selectors = [".workspace-main", ".chat-workspace", ".chat-banner", ".chat-thread", ".composer"];
      const viewportWidth = document.documentElement.clientWidth;
      return {
        viewportWidth,
        rootScrollWidth: document.documentElement.scrollWidth,
        boxes: selectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!element) return { selector, left: NaN, right: NaN };
          const rect = element.getBoundingClientRect();
          return { selector, left: rect.left, right: rect.right };
        }),
      };
    });
    expect(geometry.rootScrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    for (const box of geometry.boxes) {
      expect(box.left, JSON.stringify(geometry)).toBeGreaterThanOrEqual(-1);
      expect(box.right, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    }
    // Layout must scroll in the thread, not move the outer app shell or document.
    const scrollOrigins = await page.evaluate(() => ({
      outer: document.scrollingElement?.scrollTop ?? 0,
      workspace: document.querySelector(".workspace-main")?.scrollTop ?? 0,
    }));
    expect(scrollOrigins.outer).toBe(0);
    expect(scrollOrigins.workspace).toBe(0);
    await page.screenshot({ path: `test-results/chat-${width}px.png`, fullPage: false });
  });
}

test("header collapses while chatting and expands at the top with no manual toggle", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chats/session-1");
  const header = page.locator(".chat-banner");
  await expect(page.locator(".message-line").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /collapse chat header|expand chat header/i })).toHaveCount(0);
  await page.locator(".chat-thread").evaluate((node) => {
    const el = node as HTMLElement;
    el.style.maxHeight = "180px";
    el.scrollTop = 0;
    el.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(header).not.toHaveClass(/is-collapsed/);
  await page.locator(".chat-thread").evaluate((node) => {
    const el = node as HTMLElement;
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(header).toHaveClass(/is-collapsed/);
  await page.locator(".chat-thread").evaluate((node) => {
    const el = node as HTMLElement;
    el.scrollTop = 0;
    el.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(header).not.toHaveClass(/is-collapsed/);
});
