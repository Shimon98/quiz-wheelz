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

function gameplay(overrides = {}) {
  return { mode: "NORMAL", effectiveSpeed: 1.2, activeEffects: [slowdown()], ...overrides };
}

describe("mapStudentRaceGameplay", () => {
  it("maps the server gameplay as it arrives", () => {
    expect(mapStudentRaceGameplay(gameplay())).toEqual(gameplay());
  });

  it("accepts the zero effective speed of a player who is not racing", () => {
    expect(mapStudentRaceGameplay(gameplay({ effectiveSpeed: 0, activeEffects: [] })).effectiveSpeed).toBe(0);
  });

  it("preserves a future mode it cannot present yet", () => {
    expect(mapStudentRaceGameplay(gameplay({ mode: "FUTURE_MODE" })).mode).toBe("FUTURE_MODE");
  });

  it.each([null, 0, -2])("preserves a well-formed future effect whose magnitude is %s", (magnitudeTenths) => {
    const future = slowdown({ effectId: 99, type: "FUTURE_EFFECT", source: "FUTURE_SOURCE", magnitudeTenths });

    expect(mapStudentRaceGameplay(gameplay({ activeEffects: [future] })).activeEffects).toEqual([future]);
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
      .toEqual([valid]);
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
