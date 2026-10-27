import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import { STUDENT_RACE_MOMENT } from "../../runtime/studentRaceRuntimeConstants";
import useStudentRaceLuckNotice from "../useStudentRaceLuckNotice";

const NOW = 1_700_000_000_000;

function gameplay({ activeEffects = [], recentEvents = [] } = {}) {
  return { mode: "NORMAL", effectiveSpeed: 1, activeEffects, challenge: null, luck: { recentEvents } };
}

const orb = (occurredAtEpochMs) => ({ eventId: 1, selectedType: "ENERGY_ORB", appliedType: "ENERGY_ORB",
  outcome: "APPLIED", occurredAtEpochMs, serverClockOffsetMs: 0 });
const tailwindEvent = (occurredAtEpochMs) => ({ eventId: 2, selectedType: "TAILWIND", appliedType: "TAILWIND",
  outcome: "APPLIED", occurredAtEpochMs, serverClockOffsetMs: 0 });
const tailwind = { effectId: 1, type: "SPEED_BOOST", source: "LUCK_EVENT", magnitudeTenths: 2,
  startsAtEpochMs: NOW - 500, endsAtEpochMs: NOW + 3000, serverClockOffsetMs: 0 };
const challengeSlowdown = { ...tailwind, type: "SPEED_SLOW", source: "CHALLENGE_TIMEOUT" };

describe("useStudentRaceLuckNotice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    ["no gameplay", null, null],
    ["no Luck at all", gameplay(), null],
    ["only a challenge slowdown", gameplay({ activeEffects: [challengeSlowdown] }), null],
    ["an announced Energy Orb that is old news", gameplay({ recentEvents: [orb(NOW - STUDENT_RACE_CONFIG.luckNoticeMs)] }), 1],
    ["an Energy Orb this screen never announced", gameplay({ recentEvents: [orb(NOW - 500)] }), null],
  ])("tells nothing and keeps no clock running with %s", (_, value, announcedLuckEventId) => {
    const { result } = renderHook(() => useStudentRaceLuckNotice(value, announcedLuckEventId));

    expect(result.current).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ends a live Tailwind on time with one wake-up, then lets the clock rest", () => {
    const { result } = renderHook(() => useStudentRaceLuckNotice(gameplay({ activeEffects: [tailwind] }), null));

    expect(result.current).toBe(STUDENT_RACE_MOMENT.LUCK_TAILWIND);
    expect(vi.getTimerCount()).toBe(1);

    act(() => vi.advanceTimersByTime(2999));
    expect(result.current).toBe(STUDENT_RACE_MOMENT.LUCK_TAILWIND);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  // The line's clock rests while there is no Luck, so the first Luck after a long quiet stretch meets an old reading.
  describe("after 90 s without Luck", () => {
    const QUIET_MS = 90_000;

    function quietLine() {
      const view = renderHook(({ value, announced }) => useStudentRaceLuckNotice(value, announced),
        { initialProps: { value: gameplay(), announced: null } });
      act(() => vi.advanceTimersByTime(QUIET_MS));
      expect(vi.getTimerCount()).toBe(0);
      return view;
    }

    it("tells a fresh Tailwind on the very render it arrives and ends it on time", () => {
      const { result, rerender } = quietLine();
      const arrivedAt = NOW + QUIET_MS;
      const window = { ...tailwind, startsAtEpochMs: arrivedAt, endsAtEpochMs: arrivedAt + 4_000 };

      rerender({ value: gameplay({ activeEffects: [window], recentEvents: [tailwindEvent(arrivedAt)] }), announced: 2 });
      expect(result.current).toBe(STUDENT_RACE_MOMENT.LUCK_TAILWIND);

      act(() => vi.advanceTimersByTime(3_999));
      expect(result.current).toBe(STUDENT_RACE_MOMENT.LUCK_TAILWIND);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("tells a fresh Energy Orb for its whole news time and ends it on time", () => {
      const { result, rerender } = quietLine();

      rerender({ value: gameplay({ recentEvents: [orb(NOW + QUIET_MS)] }), announced: 1 });
      expect(result.current).toBe(STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB);

      act(() => vi.advanceTimersByTime(STUDENT_RACE_CONFIG.luckNoticeMs - 1));
      expect(result.current).toBe(STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it("tells an announced Energy Orb until its news time is over, then lets the clock rest", () => {
    const { result } = renderHook(() => useStudentRaceLuckNotice(gameplay({ recentEvents: [orb(NOW - 500)] }), 1));

    expect(result.current).toBe(STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB);
    expect(vi.getTimerCount()).toBe(1);

    act(() => vi.advanceTimersByTime(STUDENT_RACE_CONFIG.luckNoticeMs - 500));
    expect(result.current).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
