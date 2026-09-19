import { describe, expect, it } from "vitest";

import {
  estimateServerNowEpochMs,
  resolveRaceElapsedMs,
} from "../teacherServerClock";

const clock = { serverTimeEpochMs: 1_755_600_000_000, receivedAtPerformanceNow: 2_000 };

describe("estimateServerNowEpochMs", () => {
  it("progresses the server time by the local monotonic delta only", () => {
    expect(estimateServerNowEpochMs(clock, 2_000)).toBe(1_755_600_000_000);
    expect(estimateServerNowEpochMs(clock, 12_500)).toBe(1_755_600_010_500);
    expect(estimateServerNowEpochMs(clock, null)).toBe(1_755_600_000_000);
  });

  it("never runs backwards when a fresher anchor arrives after the last tick", () => {
    expect(estimateServerNowEpochMs(clock, 1_000)).toBe(1_755_600_000_000);
  });

  it("returns null without an anchor", () => {
    expect(estimateServerNowEpochMs(null, 5_000)).toBeNull();
  });
});

describe("resolveRaceElapsedMs", () => {
  const started = 1_755_600_000_000;

  it("measures a running race against the estimated server time and clamps at zero", () => {
    const race = { status: "IN_PROGRESS", startedAtEpochMs: started, finishedAtEpochMs: null };

    expect(resolveRaceElapsedMs(race, started + 61_000)).toBe(61_000);
    expect(resolveRaceElapsedMs(race, started - 500)).toBe(0);
    expect(resolveRaceElapsedMs(race, null)).toBeNull();
  });

  it("freezes a finished race on its own lifecycle timestamps", () => {
    const race = { status: "FINISHED", startedAtEpochMs: started, finishedAtEpochMs: started + 90_000 };

    expect(resolveRaceElapsedMs(race, started + 999_000)).toBe(90_000);
  });

  it("returns null when the start timestamp is missing or the race is not running", () => {
    expect(resolveRaceElapsedMs({ status: "IN_PROGRESS", startedAtEpochMs: null }, started)).toBeNull();
    expect(resolveRaceElapsedMs({ status: "FINISHED", startedAtEpochMs: started, finishedAtEpochMs: null }, started)).toBeNull();
    expect(resolveRaceElapsedMs({ status: "WAITING_FOR_PLAYERS", startedAtEpochMs: null }, started)).toBeNull();
    expect(resolveRaceElapsedMs(null, started)).toBeNull();
  });
});
