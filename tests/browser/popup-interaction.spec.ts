import { expect, test } from "@playwright/test";

const findBlockedState = async (page: import("@playwright/test").Page) => page.evaluate(() => {
  const element = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  const body = document.body;
  const html = document.documentElement;
  const style = getComputedStyle(body);
  return {
    htmlInert: html.inert,
    bodyInert: body.inert,
    inlineBodyPointer: body.style.pointerEvents,
    computedBodyPointer: style.pointerEvents,
    htmlPointer: getComputedStyle(html).pointerEvents,
    inertElements: [...document.querySelectorAll("[inert]")].map(x => x.tagName + "." + x.className).slice(0, 10),
    popups: [...document.querySelectorAll('[data-slot="dropdown-menu-content"],[data-slot="popover-content"],[data-slot="dialog-content"],[data-slot="dialog-overlay"]')].map(x => ({
      slot: x.getAttribute("data-slot"), state: x.getAttribute("data-open"), display: getComputedStyle(x).display,
      pointerEvents: getComputedStyle(x).pointerEvents,
    })),
    centerElement: element?.tagName + "." + element?.className,
    activeElement: document.activeElement?.tagName + "." + (document.activeElement as HTMLElement)?.className,
  };
});

test("modal rename via dropdown is followed by interactive composer", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/chats/session-1");
  await page.getByRole("button",{name:"Open navigation"}).click();
  await page.getByRole("button",{name:"Chat actions for Q3 Financial Summary"}).click();
  await page.getByRole("menuitem",{name:"Rename"}).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button",{name:"Cancel"}).click();
  await page.getByRole("button",{name:"Close navigation"}).last().click();
  const state = await findBlockedState(page);
  console.log("AFTER_RENAME",JSON.stringify(state));
  await expect(page.getByRole("button",{name:"Attach a document"})).toBeEnabled();
  await page.getByRole("button",{name:"Attach a document"}).click({timeout:4000});
  await expect(page.getByText("Upload New PDF")).toBeVisible();
});

test("outside dismiss + textarea keyboard blur still accepts taps", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/chats/session-1");
  await page.getByRole("button",{name:"Attach a document"}).click();
  await expect(page.getByText("Upload New PDF")).toBeVisible();
  await page.locator(".chat-banner").click({position:{x:6,y:10}});
  await expect(page.getByText("Upload New PDF")).toBeHidden();
  console.log("AFTER_OUTSIDE_ATTACH",JSON.stringify(await findBlockedState(page)));
  await page.getByRole("textbox",{name:"Your message"}).fill("Hello from QA");
  await page.locator(".chat-banner").click({position:{x:6,y:10}});
  console.log("AFTER_KEYBOARD_BLUR",JSON.stringify(await findBlockedState(page)));
  await page.getByRole("button",{name:"Thinking Mode"}).click({timeout:4000});
  await expect(page.getByText("Ultra",{exact:true})).toBeVisible();
});

test("answer mode and account popup dismiss restores pointer interaction",async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/chats/session-1");
  await page.getByRole("button",{name:"Answer Mode"}).click();
  await page.locator(".chat-banner").click({position:{x:6,y:10}});
  console.log("AFTER_ANSWER",JSON.stringify(await findBlockedState(page)));
  await page.getByRole("button",{name:"Open navigation"}).click();
  await page.getByRole("button",{name:"Account settings"}).click();
  await page.locator(".sidebar-session-row").first().click({force:true});
  console.log("AFTER_ACCOUNT",JSON.stringify(await findBlockedState(page)));
});
