import { describe, expect, it } from "vitest";

import {
  createDefaultStudentRaceGameplay,
  mapStudentRaceGameplay,
  resolveStudentRacePresentationSpeed,
} from "../mapStudentRaceGameplay";

function slowdown(overrides = {}) {
  return {
    effectId: 41,
    type: "SPEED_SLOW",
    source: "CHALLENGE_TIMEOUT",
    magnitudeTenths: 1,
    startsAtEpochMs: 100000,
    endsAtEpochMs: 103000,
    ...overrides,
  };
}

// A mapped effect or Luck event carries the clock of the snapshot it came with.
function calibrated(item, serverClockOffsetMs = 0) {
  return { ...item, serverClockOffsetMs };
}

function gameplay(overrides = {}) {
  return { mode: "NORMAL", effectiveSpeed: 1.2, activeEffects: [slowdown()], ...overrides };
}

function luckEvent(overrides = {}) {
  return {
    eventId: 31,
    selectedType: "TAILWIND",
    appliedType: "TAILWIND",
    outcome: "APPLIED",
    occurredAtEpochMs: 100500,
    ...overrides,
  };
}

const NO_POWER_UPS = { guardShieldCharges: 0, guardShieldAwardQuestionId: null };
const NO_LUCK = { recentEvents: [] };

describe("mapStudentRaceGameplay", () => {
  it("maps the server gameplay as it arrives, with no shield and no Luck history when the snapshot has none", () => {
    expect(mapStudentRaceGameplay(gameplay()))
      .toEqual({
        ...gameplay(), activeEffects: [calibrated(slowdown())], challenge: null, powerUps: NO_POWER_UPS, luck: NO_LUCK,
      });
  });

  it("calibrates each effect to the clock it was given, so its window can be judged on this device", () => {
    expect(mapStudentRaceGameplay(gameplay(), { serverClockOffsetMs: -250 }).activeEffects)
      .toEqual([calibrated(slowdown(), -250)]);
  });

  it("starts with no shield and no Luck history", () => {
    expect(createDefaultStudentRaceGameplay()).toMatchObject({ powerUps: NO_POWER_UPS, luck: NO_LUCK });
  });

  it.each([
    ["a charged shield", { guardShieldCharges: 1, guardShieldAwardQuestionId: 77 }],
    ["a shield that was awarded and already used", { guardShieldCharges: 0, guardShieldAwardQuestionId: 77 }],
    ["no shield", NO_POWER_UPS],
  ])("maps %s as the server holds it", (_, powerUps) => {
    expect(mapStudentRaceGameplay(gameplay({ powerUps })).powerUps).toEqual(powerUps);
  });

  it("maps the Luck history as it arrives, keeping what was selected apart from what was applied", () => {
    const recentEvents = [
      luckEvent(),
      luckEvent({ eventId: 32, selectedType: "TAILWIND", appliedType: "ENERGY_ORB" }),
    ];

    expect(mapStudentRaceGameplay(gameplay({ luck: { recentEvents } })).luck)
      .toEqual({ recentEvents: recentEvents.map((event) => calibrated(event)) });
  });

  it("calibrates each Luck event to the clock it was given, so its age can be judged on this device", () => {
    expect(mapStudentRaceGameplay(gameplay({ luck: { recentEvents: [luckEvent()] } }), { serverClockOffsetMs: 75 })
      .luck.recentEvents).toEqual([calibrated(luckEvent(), 75)]);
  });

  it("preserves a Luck type or outcome it cannot present yet", () => {
    const future = luckEvent({ eventId: 40, selectedType: "FUTURE_TYPE", appliedType: "FUTURE_TYPE", outcome: "NO_EFFECT" });

    expect(mapStudentRaceGameplay(gameplay({ luck: { recentEvents: [future] } })).luck.recentEvents)
      .toEqual([calibrated(future)]);
  });

  it.each([
    ["a missing id", { eventId: null }],
    ["a non-positive id", { eventId: 0 }],
    ["a missing selected type", { selectedType: null }],
    ["a blank applied type", { appliedType: " " }],
    ["a missing outcome", { outcome: undefined }],
    ["a missing time", { occurredAtEpochMs: undefined }],
  ])("drops only the Luck event with %s", (_, broken) => {
    const first = luckEvent();
    const last = luckEvent({ eventId: 33, selectedType: "MUD_SPLASH", appliedType: "MUD_SPLASH" });
    const mapped = mapStudentRaceGameplay(gameplay({
      luck: { recentEvents: [first, luckEvent({ eventId: 32, ...broken }), null, "TAILWIND", last] },
    }));

    expect(mapped.luck.recentEvents).toEqual([calibrated(first), calibrated(last)]);
    expect(mapped.effectiveSpeed).toBe(1.2);
  });

  it.each([
    ["power-ups that are not an object", "shield"],
    ["a negative shield charge", { guardShieldCharges: -1, guardShieldAwardQuestionId: null }],
    ["a fractional shield charge", { guardShieldCharges: 0.5, guardShieldAwardQuestionId: null }],
    ["an award question that is not an id", { guardShieldCharges: 1, guardShieldAwardQuestionId: 0 }],
  ])("drops only the power-ups for %s", (_, powerUps) => {
    const recentEvents = [luckEvent()];
    const mapped = mapStudentRaceGameplay(gameplay({ powerUps, luck: { recentEvents } }));

    expect(mapped.powerUps).toEqual(NO_POWER_UPS);
    expect(mapped.luck).toEqual({ recentEvents: [calibrated(luckEvent())] });
    expect(mapped.activeEffects).toEqual([calibrated(slowdown())]);
  });

  it.each([
    ["Luck that is not an object", []],
    ["a Luck history that is not a list", { recentEvents: null }],
  ])("drops only the Luck history for %s", (_, luck) => {
    const powerUps = { guardShieldCharges: 1, guardShieldAwardQuestionId: 77 };
    const mapped = mapStudentRaceGameplay(gameplay({ powerUps, luck }));

    expect(mapped.luck).toEqual(NO_LUCK);
    expect(mapped.powerUps).toEqual(powerUps);
    expect(mapped.effectiveSpeed).toBe(1.2);
  });

  it("maps the challenge part with the clock it was given", () => {
    const challenge = {
      energy: 0,
      threshold: 100,
      offer: { offerId: 9, expiresAtEpochMs: 112000, choices: ["SAFE_RUN"] },
      run: null,
      lastResult: null,
    };

    expect(mapStudentRaceGameplay(gameplay({ mode: "CHALLENGE_CHOICE", challenge }), { serverClockOffsetMs: 40 })
      .challenge.offer).toEqual({ ...challenge.offer, serverClockOffsetMs: 40 });
  });

  it("keeps the gameplay when only the challenge part is malformed", () => {
    const mapped = mapStudentRaceGameplay(gameplay({ challenge: { energy: "full" } }));

    expect(mapped.challenge).toBeNull();
    expect(mapped.effectiveSpeed).toBe(1.2);
  });

  it("accepts the zero effective speed of a player who is not racing", () => {
    expect(mapStudentRaceGameplay(gameplay({ effectiveSpeed: 0, activeEffects: [] })).effectiveSpeed).toBe(0);
  });

  it("preserves a future mode it cannot present yet", () => {
    expect(mapStudentRaceGameplay(gameplay({ mode: "FUTURE_MODE" })).mode).toBe("FUTURE_MODE");
  });

  it.each([null, 0, -2])("preserves a well-formed future effect whose magnitude is %s", (magnitudeTenths) => {
    const future = slowdown({ effectId: 99, type: "FUTURE_EFFECT", source: "FUTURE_SOURCE", magnitudeTenths });

    expect(mapStudentRaceGameplay(gameplay({ activeEffects: [future] })).activeEffects).toEqual([calibrated(future)]);
  });

  it.each([
    ["a missing id", { effectId: null }],
    ["a non-positive id", { effectId: 0 }],
    ["a blank type", { type: " " }],
    ["a missing source", { source: undefined }],
    ["a fractional magnitude", { magnitudeTenths: 1.5 }],
    ["a missing start", { startsAtEpochMs: undefined }],
    ["an end that is not after its start", { endsAtEpochMs: 100000 }],
  ])("drops only the effect with %s", (_, broken) => {
    const valid = slowdown({ effectId: 42, startsAtEpochMs: 103000, endsAtEpochMs: 106000 });

    expect(mapStudentRaceGameplay(gameplay({ activeEffects: [slowdown(broken), valid] })).activeEffects)
      .toEqual([calibrated(valid)]);
  });

  it.each([
    undefined,
    null,
    "NORMAL",
    [],
    gameplay({ mode: "" }),
    gameplay({ effectiveSpeed: -1 }),
    gameplay({ effectiveSpeed: Number.NaN }),
    gameplay({ activeEffects: null }),
  ])("falls back to normal gameplay for a missing or malformed container: %o", (raw) => {
    expect(mapStudentRaceGameplay(raw)).toEqual(createDefaultStudentRaceGameplay());
  });
});

describe("resolveStudentRacePresentationSpeed", () => {
  it("presents the server effective speed, including a stopped player's zero", () => {
    expect(resolveStudentRacePresentationSpeed(1.3, gameplay({ effectiveSpeed: 1.2 }))).toBe(1.2);
    expect(resolveStudentRacePresentationSpeed(1.3, gameplay({ effectiveSpeed: 0 }))).toBe(0);
  });

  it("falls back to the base speed only when the effective speed is unknown", () => {
    expect(resolveStudentRacePresentationSpeed(1.3, createDefaultStudentRaceGameplay())).toBe(1.3);
  });
});
