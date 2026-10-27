import { describe, expect, it } from "vitest";

import { RACE_LUCK_EVENT_TYPES } from "../../../../constants/raceGameplayConstants";
import { STUDENT_RACE_MOMENT } from "../studentRaceRuntimeConstants";
import {
  hasGuardShield,
  isGameplayEffectActiveAt,
  selectActiveLuckEffect,
  selectLuckClockFloor,
  selectLuckNotice,
  selectLuckNoticeChangeAt,
} from "../studentRaceGameplayMode";

function tailwind(overrides = {}) {
  return {
    effectId: 5,
    type: "SPEED_BOOST",
    source: "LUCK_EVENT",
    magnitudeTenths: 2,
    startsAtEpochMs: 10_000,
    endsAtEpochMs: 14_000,
    serverClockOffsetMs: 0,
    ...overrides,
  };
}

const mud = (overrides = {}) => tailwind({ type: "SPEED_SLOW", magnitudeTenths: 1, endsAtEpochMs: 13_000, ...overrides });

function gameplay(activeEffects = [], guardShieldCharges = 0, recentEvents = []) {
  return {
    mode: "NORMAL",
    effectiveSpeed: 1,
    activeEffects,
    challenge: null,
    powerUps: { guardShieldCharges, guardShieldAwardQuestionId: guardShieldCharges > 0 ? 70 : null },
    luck: { recentEvents },
  };
}

function luckEvent(appliedType, outcome = "APPLIED", overrides = {}) {
  return {
    eventId: 3,
    selectedType: appliedType,
    appliedType,
    outcome,
    occurredAtEpochMs: 10_000,
    serverClockOffsetMs: 0,
    ...overrides,
  };
}

const NEWS_MS = 4_000;
const afterLuck = (...recentEvents) => gameplay([], 0, recentEvents);

describe("isGameplayEffectActiveAt", () => {
  it.each([
    [9_999, false],
    [10_000, true],
    [13_999, true],
    [14_000, false],
  ])("judges the server window at device time %i as active: %s", (clientNowEpochMs, active) => {
    expect(isGameplayEffectActiveAt(tailwind(), clientNowEpochMs)).toBe(active);
  });

  it("reads the window on the server clock, so a device clock that is behind still ends it on time", () => {
    const fromBehindDevice = tailwind({ serverClockOffsetMs: 3_000 });

    expect(isGameplayEffectActiveAt(fromBehindDevice, 10_999)).toBe(true);
    expect(isGameplayEffectActiveAt(fromBehindDevice, 11_000)).toBe(false);
  });
});

describe("selectActiveLuckEffect", () => {
  it.each([
    ["Tailwind", tailwind(), RACE_LUCK_EVENT_TYPES.TAILWIND],
    ["Mud", mud(), RACE_LUCK_EVENT_TYPES.MUD_SPLASH],
  ])("names an active %s window by the Luck type behind it", (_, effect, type) => {
    expect(selectActiveLuckEffect(gameplay([effect]), 11_000)).toBe(type);
  });

  it("lets a Luck window go as soon as the server window ends, without waiting for the next snapshot", () => {
    expect(selectActiveLuckEffect(gameplay([mud()]), 13_000)).toBeNull();
  });

  it.each([
    ["a challenge timeout slowdown", tailwind({ type: "SPEED_SLOW", source: "CHALLENGE_TIMEOUT" })],
    ["a Turbo failure slowdown", tailwind({ type: "SPEED_SLOW", source: "TURBO_FAILURE" })],
    ["a Luck effect of a type it cannot present", tailwind({ type: "FUTURE_EFFECT" })],
  ])("presents no Luck window for %s", (_, effect) => {
    expect(selectActiveLuckEffect(gameplay([effect]), 11_000)).toBeNull();
  });

  it("finds the Luck window among other effects", () => {
    const slowdown = tailwind({ effectId: 4, type: "SPEED_SLOW", source: "CHALLENGE_TIMEOUT" });

    expect(selectActiveLuckEffect(gameplay([slowdown, mud()]), 11_000)).toBe(RACE_LUCK_EVENT_TYPES.MUD_SPLASH);
  });

  it("presents no Luck window without gameplay", () => {
    expect(selectActiveLuckEffect(null, 11_000)).toBeNull();
  });
});

describe("selectLuckNotice", () => {
  it.each([
    ["Tailwind", tailwind(), STUDENT_RACE_MOMENT.LUCK_TAILWIND],
    ["Mud", mud(), STUDENT_RACE_MOMENT.LUCK_MUD],
  ])("tells about an open %s window for as long as it lasts", (_, effect, notice) => {
    expect(selectLuckNotice(gameplay([effect]), 12_000, NEWS_MS)).toBe(notice);
    expect(selectLuckNotice(gameplay([effect]), effect.endsAtEpochMs, NEWS_MS)).toBeNull();
  });

  it.each([
    ["an Energy Orb", luckEvent("ENERGY_ORB"), STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB],
    ["a Tailwind applied as an Energy Orb", luckEvent("ENERGY_ORB", "APPLIED", { selectedType: "TAILWIND" }),
      STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB],
    ["a Mud Splash the shield blocked", luckEvent("MUD_SPLASH", "BLOCKED_BY_SHIELD"),
      STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED],
  ])("keeps %s as news for a short while after the server decided it", (_, event, notice) => {
    expect(selectLuckNotice(afterLuck(event), 10_000 + NEWS_MS - 1, NEWS_MS, 3)).toBe(notice);
    expect(selectLuckNotice(afterLuck(event), 10_000 + NEWS_MS, NEWS_MS, 3)).toBeNull();
  });

  it.each([
    ["no event at all (a refresh or a reconnect)", null],
    ["another event", 2],
  ])("tells one-shot news only when this screen announced that event, not after %s", (_, announcedLuckEventId) => {
    const orb = afterLuck(luckEvent("ENERGY_ORB"));

    expect(selectLuckNotice(orb, 10_500, NEWS_MS, announcedLuckEventId)).toBeNull();
    expect(selectLuckNotice(orb, 10_500, NEWS_MS, 3)).toBe(STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB);
  });

  it("dates an event on the clock of the snapshot that carried it", () => {
    const event = luckEvent("ENERGY_ORB", "APPLIED", { serverClockOffsetMs: 2_000 });

    expect(selectLuckNotice(afterLuck(event), 10_000 + NEWS_MS - 2_001, NEWS_MS, 3))
      .toBe(STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB);
    expect(selectLuckNotice(afterLuck(event), 10_000 + NEWS_MS - 2_000, NEWS_MS, 3)).toBeNull();
  });

  it("lets a Tailwind or Mud event end with its window, never after it", () => {
    expect(selectLuckNotice(afterLuck(luckEvent("TAILWIND"), luckEvent("MUD_SPLASH")), 10_500, NEWS_MS, 3)).toBeNull();
  });

  it("tells only the newest event", () => {
    const orb = luckEvent("ENERGY_ORB", "APPLIED", { eventId: 2, occurredAtEpochMs: 9_000 });

    expect(selectLuckNotice(afterLuck(orb, luckEvent("MUD_SPLASH")), 10_500, NEWS_MS, 3)).toBeNull();
  });

  it("tells nothing about an event it cannot date", () => {
    const undated = luckEvent("ENERGY_ORB", "APPLIED", { serverClockOffsetMs: undefined });

    expect(selectLuckNotice(afterLuck(undated), 10_500, NEWS_MS, 3)).toBeNull();
  });

  it("has no Luck news without gameplay or Luck history", () => {
    expect(selectLuckNotice(null, 10_500, NEWS_MS)).toBeNull();
    expect(selectLuckNotice({ mode: "NORMAL", activeEffects: [] }, 10_500, NEWS_MS)).toBeNull();
  });
});

describe("selectLuckClockFloor", () => {
  it("reads the latest Luck instant on this device's clock", () => {
    const early = luckEvent("ENERGY_ORB", "APPLIED", { eventId: 2, occurredAtEpochMs: 9_000 });
    const fromAheadServer = luckEvent("MUD_SPLASH", "APPLIED", { occurredAtEpochMs: 10_000, serverClockOffsetMs: 2_000 });

    expect(selectLuckClockFloor(afterLuck(early, fromAheadServer))).toBe(9_000);
  });

  it.each([
    ["without gameplay", null],
    ["without Luck history", gameplay()],
    ["with only an event it cannot date", afterLuck(luckEvent("ENERGY_ORB", "APPLIED", { serverClockOffsetMs: undefined }))],
  ])("sets no floor %s", (_, value) => {
    expect(selectLuckClockFloor(value)).toBe(0);
  });
});

describe("selectLuckNoticeChangeAt", () => {
  it.each([
    ["an open window closes", gameplay([tailwind()]), 12_000, null, 14_000],
    ["a window opens on a clock read before it arrived", gameplay([tailwind()]), 9_000, null, 10_000],
    ["announced news runs out", afterLuck(luckEvent("ENERGY_ORB")), 11_000, 3, 10_000 + NEWS_MS],
    ["the first of a window end and news", gameplay([mud({ endsAtEpochMs: 15_000 })], 0, [luckEvent("ENERGY_ORB")]), 11_000,
      3, 10_000 + NEWS_MS],
  ])("wakes up once when %s", (_, value, clientNowEpochMs, announcedLuckEventId, changeAt) => {
    expect(selectLuckNoticeChangeAt(value, clientNowEpochMs, NEWS_MS, announcedLuckEventId)).toBe(changeAt);
  });

  it("reads the edges on the clock of the snapshot that carried them", () => {
    expect(selectLuckNoticeChangeAt(gameplay([tailwind({ serverClockOffsetMs: 2_000 })]), 9_000, NEWS_MS, null))
      .toBe(12_000);
  });

  it.each([
    ["without gameplay", null, null],
    ["without Luck", gameplay(), null],
    ["after a window ended", gameplay([tailwind()]), null],
    ["with old news", afterLuck(luckEvent("ENERGY_ORB", "APPLIED", { occurredAtEpochMs: 10_000 - NEWS_MS })), 3],
    ["with news this screen never announced", afterLuck(luckEvent("ENERGY_ORB")), null],
    ["with news it cannot date", afterLuck(luckEvent("ENERGY_ORB", "APPLIED", { serverClockOffsetMs: undefined })), 3],
    ["for a challenge slowdown", gameplay([tailwind({ type: "SPEED_SLOW", source: "CHALLENGE_TIMEOUT" })]), null],
  ])("has nothing to wait for %s", (_, value, announcedLuckEventId) => {
    expect(selectLuckNoticeChangeAt(value, 14_000, NEWS_MS, announcedLuckEventId)).toBeNull();
  });
});

describe("hasGuardShield", () => {
  it.each([
    [1, true],
    [0, false],
  ])("reads %i shield charges as a raised shield: %s", (charges, raised) => {
    expect(hasGuardShield(gameplay([], charges))).toBe(raised);
  });

  it("raises no shield without power-ups", () => {
    expect(hasGuardShield({ mode: "NORMAL" })).toBe(false);
    expect(hasGuardShield(null)).toBe(false);
  });
});
