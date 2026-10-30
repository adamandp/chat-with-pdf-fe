import { expect, test } from "@playwright/test";

// Touch emulation covers outside taps that mouse-only smoke tests miss.
// Real iOS Safari keyboard lifecycle still needs a physical-device review.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("repeated outside taps close popovers without blocking the page", async ({ page }) => {
  await page.goto("/chats/session-1");
  const attach = page.getByRole("button", { name: "Attach a document" });
  const mode = page.getByRole("button", { name: "Answer Mode" });
  const thinking = page.getByRole("button", { name: "Thinking Mode" });
  for (let i = 0; i < 3; i++) {
    await attach.tap();
    await expect(page.getByText("Upload New PDF")).toBeVisible();
    await page.touchscreen.tap(24, 151);
    await expect(page.getByText("Upload New PDF")).toBeHidden();

    await mode.tap();
    await expect(page.getByText("Answer Mode", { exact: true })).toBeVisible();
    await page.touchscreen.tap(24, 151);
    await expect(page.getByText("Answer Mode", { exact: true })).toBeHidden();

    await thinking.tap();
    await expect(page.getByText("Ultra", { exact: true })).toBeVisible();
    await page.touchscreen.tap(24, 151);
    await expect(page.getByText("Ultra", { exact: true })).toBeHidden();

    await page.getByRole("textbox", { name: "Your message" }).fill(`Touch text ${i}`);
    await page.touchscreen.tap(24, 151);
    await expect(attach).toBeEnabled();
    const blocked = await page.evaluate(() => ({
      inert: document.body.inert || document.documentElement.inert,
      pointerEvents: getComputedStyle(document.body).pointerEvents,
      overlays: document.querySelectorAll('[data-slot="dialog-overlay"]').length,
    }));
    expect(blocked).toEqual({ inert: false, pointerEvents: "auto", overlays: 0 });
  }
});

test("touch-driven rename remains interactive after closing modal", async ({ page }) => {
  await page.goto("/chats/session-1");
  await page.getByRole("button", { name: "Open navigation" }).tap();
  const actions = page.getByRole("button", { name: "Chat actions for Q3 Financial Summary" });
  await actions.tap();
  await page.getByRole("menuitem", { name: "Rename" }).tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).tap();
  await expect(page.getByRole("dialog")).toBeHidden();
  await actions.tap();
  await expect(page.getByRole("menuitem", { name: "Fork chat" })).toBeVisible();
  // A tap outside the open menu also lands on the drawer's backdrop and closes it.
  // That's expected; don't try to tap an off-screen close button afterwards.
  await page.touchscreen.tap(370, 210);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  await page.getByRole("textbox", { name: "Your message" }).fill("Touch still enabled");
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
});
