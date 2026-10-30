import { describe, expect, test } from "bun:test";
import { getKeyboardViewport } from "../lib/mobile-viewport";

const base = {
  baselineHeight: 844,
  visualHeight: 844,
  visualTop: 0,
  mobile: true,
  editableFocused: true,
};

describe("iOS keyboard viewport sizing", () => {
  test("ignores changes when keyboard is closed", () => {
    expect(getKeyboardViewport(base)).toBeNull();
  });

  test("positions shell above the active software keyboard", () => {
    expect(getKeyboardViewport({ ...base, visualHeight: 476, visualTop: 25 }))
      .toEqual({ height: 476, top: 25 });
  });

  test("recovers fully after the keyboard is dismissed", () => {
    expect(getKeyboardViewport({ ...base, visualHeight: 476 })).toEqual({ height: 476, top: 0 });
    expect(getKeyboardViewport({ ...base, visualHeight: 844 })).toBeNull();
  });

  test("ignores stale Safari visualViewport offset after dismissal", () => {
    expect(getKeyboardViewport({ ...base, visualHeight: 805, visualTop: 39 })).toBeNull();
  });

  test("ignores keyboard sizing on non-mobile or blurred inputs", () => {
    expect(getKeyboardViewport({ ...base, visualHeight: 420, mobile: false })).toBeNull();
    expect(getKeyboardViewport({ ...base, visualHeight: 420, editableFocused: false })).toBeNull();
  });
});
