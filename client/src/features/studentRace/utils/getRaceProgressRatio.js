/*
 * Presentation-only race progress for the HUD bar (C1-04). The runtime keeps
 * the raw server position/totalDistance untouched — an out-of-range position
 * only caps the DRAWN ratio, and an unknown/non-positive totalDistance
 * returns null (never a fake fallback distance).
 */
export function getRaceProgressRatio(position, totalDistance) {
  if (
    !Number.isFinite(position) ||
    !Number.isFinite(totalDistance) ||
    totalDistance <= 0
  ) {
    return null;
  }

  return Math.min(1, Math.max(0, position / totalDistance));
}
