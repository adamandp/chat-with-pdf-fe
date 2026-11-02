"use client";

import { useEffect } from "react";
import { getKeyboardViewport } from "@/lib/mobile-viewport";

/**
 * iOS Safari can keep a stale 100dvh/layout viewport after the keyboard has
 * been dismissed. Keep the app shell anchored to the stable viewport when
 * idle, and track VisualViewport only while the keyboard is genuinely open.
 *
 * The page is not allowed to scroll: only the chat thread scrolls.
 */
export function MobileViewportSync() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (!shell) return;

    const media = window.matchMedia("(max-width: 850px)");
    const viewport = window.visualViewport;
    let baselineHeight = window.innerHeight;
    let frame = 0;

    const isEditableFocused = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return false;
      return active.matches("input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable=true]");
    };

    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const focused = isEditableFocused();
        const currentVisualHeight = viewport?.height ?? window.innerHeight;
        if (!focused) {
          // Re-establish the idle baseline on keyboard dismissal / rotation.
          baselineHeight = Math.max(baselineHeight, window.innerHeight, currentVisualHeight);
        }
        const metrics = getKeyboardViewport({
          baselineHeight,
          visualHeight: currentVisualHeight,
          visualTop: viewport?.offsetTop ?? 0,
          mobile: media.matches,
          editableFocused: focused,
        });

        if (!metrics) {
          shell.style.removeProperty("--mobile-visual-height");
          shell.style.removeProperty("--mobile-visual-top");
        } else {
          shell.style.setProperty("--mobile-visual-height", `${metrics.height}px`);
          shell.style.setProperty("--mobile-visual-top", `${metrics.top}px`);
        }
      });
    };

    const reset = () => {
      shell.style.removeProperty("--mobile-visual-height");
      shell.style.removeProperty("--mobile-visual-top");
      sync();
    };

    const onBlur = () => {
      // Force immediate recovery, then recheck after the iOS keyboard animation.
      reset();
      window.setTimeout(sync, 250);
      window.setTimeout(sync, 550);
    };

    const onOrientationChange = () => {
      baselineHeight = window.innerHeight;
      reset();
    };

    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", onOrientationChange);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", onBlur);

    return () => {
      window.cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", onOrientationChange);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", onBlur);
      shell.style.removeProperty("--mobile-visual-height");
      shell.style.removeProperty("--mobile-visual-top");
    };
  }, []);

  return null;
}
