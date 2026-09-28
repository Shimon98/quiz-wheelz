import { describe, expect, it } from "vitest";

import { resolveResultsProofDelayMs, resolveResultsProofStaggerMs } from "../resultsProofSchedule";

describe("resolveResultsProofStaggerMs", () => {
  it("spreads students over eight deterministic 150 ms buckets by their race player id", () => {
    expect([8, 9, 10, 15, 16].map(resolveResultsProofStaggerMs)).toEqual([0, 150, 300, 1050, 0]);
  });

  it("gives the same student the same stagger every time", () => {
    expect(resolveResultsProofStaggerMs(13)).toBe(resolveResultsProofStaggerMs(13));
  });
});

describe("resolveResultsProofDelayMs", () => {
  it("doubles from 1.5 s and stops growing at 15 s", () => {
    expect([0, 1, 2, 3, 4, 5, 9].map((attempt) => resolveResultsProofDelayMs(attempt, 8))).toEqual([
      1500, 3000, 6000, 12000, 15000, 15000, 15000,
    ]);
  });

  it("keeps the student's stagger on every attempt so clients never line up", () => {
    expect([0, 1, 4].map((attempt) => resolveResultsProofDelayMs(attempt, 10))).toEqual([1800, 3300, 15300]);
  });

  it("never waits longer than the capped backoff plus the widest stagger", () => {
    expect(resolveResultsProofDelayMs(40, 15)).toBe(16050);
  });
});
