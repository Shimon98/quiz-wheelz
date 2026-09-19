import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useTeacherRaceElapsedTime from "../useTeacherRaceElapsedTime";
import { TEACHER_RACE_LIVE_CONFIG } from "../../config/teacherRaceLiveConfig";

const TICK = TEACHER_RACE_LIVE_CONFIG.elapsedTickMs;
const started = 1_755_600_000_000;
let monotonicNow;

function clock(serverTimeEpochMs, receivedAtPerformanceNow) {
  return { serverTimeEpochMs, receivedAtPerformanceNow };
}

function runningRace(overrides = {}) {
  return { status: "IN_PROGRESS", startedAtEpochMs: started, finishedAtEpochMs: null, ...overrides };
}

beforeEach(() => {
  vi.useFakeTimers();
  monotonicNow = 10_000;
  vi.spyOn(performance, "now").mockImplementation(() => monotonicNow);
  vi.spyOn(Date, "now").mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function advance(ms) {
  monotonicNow += ms;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useTeacherRaceElapsedTime", () => {
  it("returns null elapsed without a start timestamp and does not tick", async () => {
    const { result } = renderHook(() =>
      useTeacherRaceElapsedTime({ serverClock: clock(started + 30_000, 10_000), race: runningRace({ startedAtEpochMs: null }) }),
    );

    await advance(TICK * 3);

    expect(result.current.elapsedMs).toBeNull();
    expect(result.current.serverNowEpochMs).toBe(started + 30_000);
  });

  it("grows from the server time by the monotonic delta, ignoring the wall clock", async () => {
    const { result } = renderHook(() =>
      useTeacherRaceElapsedTime({ serverClock: clock(started + 30_000, 10_000), race: runningRace() }),
    );

    expect(result.current.elapsedMs).toBe(30_000);

    await advance(TICK * 5);

    expect(result.current.elapsedMs).toBe(35_000);
    expect(result.current.serverNowEpochMs).toBe(started + 35_000);
  });

  it("re-anchors on a fresh server clock without running backwards", async () => {
    const { result, rerender } = renderHook(
      ({ serverClock }) => useTeacherRaceElapsedTime({ serverClock, race: runningRace() }),
      { initialProps: { serverClock: clock(started + 30_000, 10_000) } },
    );

    await advance(TICK * 2);
    expect(result.current.elapsedMs).toBe(32_000);

    monotonicNow += 500;
    rerender({ serverClock: clock(started + 40_000, monotonicNow) });
    expect(result.current.elapsedMs).toBe(40_000);

    await advance(TICK);
    expect(result.current.elapsedMs).toBe(41_000);
  });

  it("freezes a finished race on its lifecycle timestamps and stops ticking", async () => {
    const { result } = renderHook(() =>
      useTeacherRaceElapsedTime({
        serverClock: clock(started + 200_000, 10_000),
        race: { status: "FINISHED", startedAtEpochMs: started, finishedAtEpochMs: started + 90_000 },
      }),
    );

    expect(result.current.elapsedMs).toBe(90_000);

    await advance(TICK * 4);

    expect(result.current.elapsedMs).toBe(90_000);
    expect(performance.now).not.toHaveBeenCalled();
  });

  it("clears its interval on unmount", async () => {
    const { unmount } = renderHook(() =>
      useTeacherRaceElapsedTime({ serverClock: clock(started, 10_000), race: runningRace() }),
    );

    unmount();
    await advance(TICK * 2);

    expect(performance.now).not.toHaveBeenCalled();
  });
});
