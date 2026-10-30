export type MobileViewportMeasurements = {
  baselineHeight: number;
  visualHeight: number;
  visualTop: number;
  mobile: boolean;
  editableFocused: boolean;
};

/**
 * Only follow the visual viewport while the software keyboard is genuinely
 * reducing the usable screen. iOS/WebKit can keep a stale offsetTop after the
 * keyboard closes; the baseline CSS height must win in that situation.
 */
export function getKeyboardViewport({
  baselineHeight, visualHeight, visualTop, mobile, editableFocused,
}: MobileViewportMeasurements): { height: number; top: number } | null {
  if (!mobile || !editableFocused) return null;
  if (!Number.isFinite(visualHeight) || visualHeight < 160) return null;
  const overlap = baselineHeight - (visualHeight + Math.max(0, visualTop));
  if (overlap < 120) return null;
  return {
    height: Math.round(visualHeight),
    top: Math.max(0, Math.round(visualTop)),
  };
}
