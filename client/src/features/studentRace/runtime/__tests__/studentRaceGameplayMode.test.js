import { describe, expect, it } from "vitest";

import {
  QUESTION_GAMEPLAY_CONTEXTS,
  RACE_GAMEPLAY_MODES,
} from "../../../../constants/raceGameplayConstants";
import {
  getQuestionContextForMode,
  hasChallengeTimeoutSlowdown,
  isChallengeChoiceMode,
  isQuestionForGameplayMode,
  isQuestionGameplayMode,
  selectChallengeOffer,
} from "../studentRaceGameplayMode";

function slowdown(overrides = {}) {
  return {
    effectId: 1,
    type: "SPEED_SLOW",
    source: "CHALLENGE_TIMEOUT",
    magnitudeTenths: 3,
    startsAtEpochMs: 1,
    endsAtEpochMs: 2,
    ...overrides,
  };
}

describe("studentRaceGameplayMode", () => {
  it("mirrors the server spelling of each special mode in its question context", () => {
    for (const variant of ["TURBO_TRIAL", "SAFE_RUN"]) {
      expect(RACE_GAMEPLAY_MODES[variant]).toBe(variant);
      expect(QUESTION_GAMEPLAY_CONTEXTS[variant]).toBe(variant);
    }
  });

  it.each([
    ["NORMAL", "NORMAL"],
    ["TURBO_TRIAL", "TURBO_TRIAL"],
    ["SAFE_RUN", "SAFE_RUN"],
    ["CHALLENGE_CHOICE", null],
    ["FUTURE_MODE", null],
    [undefined, null],
    ["constructor", null],
  ])("maps mode %s to question context %s", (mode, context) => {
    expect(getQuestionContextForMode(mode)).toBe(context);
  });

  it.each([
    ["NORMAL", true],
    ["TURBO_TRIAL", true],
    ["SAFE_RUN", true],
    ["CHALLENGE_CHOICE", false],
    ["FUTURE_MODE", false],
  ])("asks for questions in mode %s: %s", (mode, expected) => {
    expect(isQuestionGameplayMode(mode)).toBe(expected);
  });

  it("pairs a question with the mode whose context it carries", () => {
    expect(isQuestionForGameplayMode({ gameplayContext: "TURBO_TRIAL" }, "TURBO_TRIAL")).toBe(true);
    expect(isQuestionForGameplayMode({ gameplayContext: "NORMAL" }, "TURBO_TRIAL")).toBe(false);
    expect(isQuestionForGameplayMode({ gameplayContext: "NORMAL" }, "CHALLENGE_CHOICE")).toBe(false);
    expect(isQuestionForGameplayMode(null, "NORMAL")).toBe(false);
  });

  it("exposes the offer only while the server says the player is choosing", () => {
    const offer = { offerId: 3 };

    expect(isChallengeChoiceMode({ mode: "CHALLENGE_CHOICE" })).toBe(true);
    expect(selectChallengeOffer({ mode: "CHALLENGE_CHOICE", challenge: { offer } })).toBe(offer);
    expect(selectChallengeOffer({ mode: "NORMAL", challenge: { offer } })).toBeNull();
    expect(selectChallengeOffer({ mode: "CHALLENGE_CHOICE", challenge: null })).toBeNull();
    expect(selectChallengeOffer(null)).toBeNull();
  });

  it("reports only the slowdown caused by a missed challenge", () => {
    expect(hasChallengeTimeoutSlowdown({ activeEffects: [slowdown()] })).toBe(true);
    expect(hasChallengeTimeoutSlowdown({ activeEffects: [slowdown({ source: "POWER_UP" })] })).toBe(false);
    expect(hasChallengeTimeoutSlowdown({ activeEffects: [slowdown({ type: "SPEED_BOOST" })] })).toBe(false);
    expect(hasChallengeTimeoutSlowdown({ activeEffects: [] })).toBe(false);
    expect(hasChallengeTimeoutSlowdown(null)).toBe(false);
  });
});
