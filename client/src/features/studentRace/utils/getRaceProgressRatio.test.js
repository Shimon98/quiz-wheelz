import { describe, expect, it } from "vitest";

import { getRaceProgressRatio } from "./getRaceProgressRatio";

describe("getRaceProgressRatio", () => {
  it("returns the plain ratio for a valid position", () => {
    expect(getRaceProgressRatio(420, 1000)).toBe(0.42);
  });

  it("caps an over-distance position at 1 (presentation only)", () => {
    expect(getRaceProgressRatio(1005, 1000)).toBe(1);
  });

  it("caps an unexpected negative position at 0", () => {
    expect(getRaceProgressRatio(-5, 1000)).toBe(0);
  });

  it("returns null when totalDistance is unknown — never a fake fallback", () => {
    expect(getRaceProgressRatio(420, null)).toBeNull();
    expect(getRaceProgressRatio(420, undefined)).toBeNull();
    expect(getRaceProgressRatio(420, NaN)).toBeNull();
  });

  it("returns null for a non-positive totalDistance", () => {
    expect(getRaceProgressRatio(420, 0)).toBeNull();
    expect(getRaceProgressRatio(420, -100)).toBeNull();
  });

  it("returns null for a non-finite position", () => {
    expect(getRaceProgressRatio(NaN, 1000)).toBeNull();
    expect(getRaceProgressRatio(Infinity, 1000)).toBeNull();
  });
});
