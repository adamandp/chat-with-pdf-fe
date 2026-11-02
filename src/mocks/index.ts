let starting: Promise<void> | undefined;

/** Prevent initial queries racing the browser service worker startup. */
export function initMocks(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  starting ??= import("./browser").then(async ({ worker }) => {
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: { url: "/mockServiceWorker.js" },
    });
  }).catch((error: unknown) => { starting = undefined; throw error; });
  return starting;
}
