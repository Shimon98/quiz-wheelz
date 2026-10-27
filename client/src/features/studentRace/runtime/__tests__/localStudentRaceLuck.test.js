import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialRaceRuntimeState } from "../createInitialRaceRuntimeState";
import { createLocalStudentRaceLuck } from "../localStudentRaceLuck";
import { createLocalStudentRaceRuntime } from "../localStudentRaceRuntime";
import { mapLocalRuntimeSnapshotToState } from "../mapLocalRuntimeSnapshotToState";
import { STUDENT_RACE_MOMENT } from "../studentRaceRuntimeConstants";
import { hasGuardShield, selectActiveLuckEffect, selectLuckNotice } from "../studentRaceGameplayMode";

const START = 1_000_000;
const NEWS_MS = 4_000;

function gameplayAt(luck, elapsedMs) {
  const nowEpochMs = START + elapsedMs;
  return { mode: "NORMAL", activeEffects: luck.activeEffects(nowEpochMs), ...luck.gameplay(nowEpochMs) };
}

function presentedAt(luck, elapsedMs) {
  const gameplay = mapLocalRuntimeSnapshotToState(createInitialRaceRuntimeState(), {
    raceStatus: "IN_PROGRESS", playerStatus: "RACING", playerFinished: false, totalDistance: 1000, position: 0,
    speed: 1.2, movementUnitsPerSecond: 4.8, snapshotAtEpochMs: START + elapsedMs,
    gameplay: { effectiveSpeed: 1.2, ...gameplayAt(luck, elapsedMs) },
  }, START + elapsedMs).gameplay;
  const nowEpochMs = START + elapsedMs;
  // The preview screen watches every event arrive, so its moments pipeline announces the newest one.
  const announcedLuckEventId = gameplay.luck.recentEvents.at(-1)?.eventId ?? null;
  return {
    shield: hasGuardShield(gameplay),
    window: selectActiveLuckEffect(gameplay, nowEpochMs),
    notice: selectLuckNotice(gameplay, nowEpochMs, NEWS_MS, announcedLuckEventId),
    eventIds: gameplay.luck.recentEvents.map(({ eventId }) => eventId),
  };
}

describe("local Luck preview", () => {
  it.each([
    [1_000, { shield: true, window: null, notice: null, eventIds: [] }],
    [6_500, { shield: true, window: "TAILWIND", notice: STUDENT_RACE_MOMENT.LUCK_TAILWIND, eventIds: [1] }],
    [12_500, { shield: true, window: null, notice: STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, eventIds: [1, 2] }],
    [16_500, { shield: false, window: null, notice: STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED, eventIds: [2, 3] }],
    [20_500, { shield: false, window: "MUD_SPLASH", notice: STUDENT_RACE_MOMENT.LUCK_MUD, eventIds: [3, 4] }],
    [24_000, { shield: false, window: null, notice: null, eventIds: [3, 4] }],
  ])("shows every Luck presentation in turn, through the production mappers (at %i ms)", (elapsedMs, expected) => {
    expect(presentedAt(createLocalStudentRaceLuck(START), elapsedMs)).toEqual(expected);
  });

  it("starts the next cycle with the shield back and new event ids", () => {
    expect(presentedAt(createLocalStudentRaceLuck(START), 26_000 + 6_500))
      .toEqual({ shield: true, window: "TAILWIND", notice: STUDENT_RACE_MOMENT.LUCK_TAILWIND, eventIds: [5] });
  });

  it.each([
    [6_500, 2],
    [12_500, 0],
    [20_500, -1],
  ])("moves the kart the way the server would at %i ms (tenths %i)", (elapsedMs, tenths) => {
    expect(createLocalStudentRaceLuck(START).speedChangeTenths(START + elapsedMs)).toBe(tenths);
  });
});

describe("local runtime Luck scenario", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("serves the shield and Luck parts and speeds up during the Tailwind", () => {
    const runtime = createLocalStudentRaceRuntime({ scenario: "luck" });
    const first = runtime.getSnapshot();
    runtime.start();
    vi.advanceTimersByTime(6_500);
    const windy = runtime.getSnapshot();
    runtime.stop();

    expect(first.gameplay).toMatchObject({ powerUps: { guardShieldCharges: 1 }, luck: { recentEvents: [] } });
    expect(windy.gameplay.effectiveSpeed).toBeCloseTo(1.4);
    expect(windy.gameplay.activeEffects).toEqual([expect.objectContaining({ type: "SPEED_BOOST", source: "LUCK_EVENT" })]);
  });

  it("leaves the other scenarios without shield or Luck parts", () => {
    expect(createLocalStudentRaceRuntime({ scenario: null }).getSnapshot().gameplay)
      .not.toHaveProperty("luck");
  });
});
