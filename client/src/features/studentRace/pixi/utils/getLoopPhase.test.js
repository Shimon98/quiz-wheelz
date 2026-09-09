import { describe, expect, it } from "vitest";

import { getLoopPhase } from "./getLoopPhase";

describe("getLoopPhase", () => {
  it("wraps forward travel into a stable 0..1 phase", () => {
    expect(getLoopPhase(0, 960)).toBe(0);
    expect(getLoopPhase(480, 960)).toBeCloseTo(0.5);
    expect(getLoopPhase(960, 960)).toBe(0);
    expect(getLoopPhase(9600.5 * 2, 960)).toBeCloseTo(0.001, 3);
  });

  it("keeps corrective backward re-bases positive", () => {
    expect(getLoopPhase(-240, 960)).toBeCloseTo(0.75);
  });
});
