import { describe, expect, it } from "vitest";

import {
  QUESTION_GAMEPLAY_CONTEXTS,
  RACE_GAMEPLAY_MODES,
} from "../../../../constants/raceGameplayConstants";
import {
  getQuestionContextForMode,
  isChallengeChoiceMode,
  isQuestionForGameplayMode,
  isQuestionGameplayMode,
  selectChallengeOffer,
  selectChallengeResultOutcome,
  selectChallengeSlowdownSource,
  selectSafeRunProgress,
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

  it("names the challenge that caused a server slowdown and nothing else", () => {
    expect(selectChallengeSlowdownSource({ activeEffects: [slowdown()] })).toBe("CHALLENGE_TIMEOUT");
    expect(selectChallengeSlowdownSource({ activeEffects: [slowdown({ source: "TURBO_FAILURE" })] }))
      .toBe("TURBO_FAILURE");
    expect(selectChallengeSlowdownSource({ activeEffects: [slowdown({ source: "POWER_UP" })] })).toBeNull();
    expect(selectChallengeSlowdownSource({ activeEffects: [slowdown({ type: "SPEED_BOOST" })] })).toBeNull();
    expect(selectChallengeSlowdownSource({ activeEffects: [] })).toBeNull();
    expect(selectChallengeSlowdownSource(null)).toBeNull();
  });

  describe("challenge result for the answered question", () => {
    function ended(mode, lastResult) {
      return { mode, challenge: { run: null, lastResult } };
    }
    const turboWin = { challengeId: 3, type: "TURBO_TRIAL", outcome: "TURBO_SUCCESS" };
    const safePerfect = { challengeId: 4, type: "SAFE_RUN", outcome: "SAFE_PERFECT" };

    it("names the server outcome once the run that asked the question has ended", () => {
      expect(selectChallengeResultOutcome(ended("NORMAL", turboWin), "TURBO_TRIAL")).toBe("TURBO_SUCCESS");
      expect(selectChallengeResultOutcome(ended("NORMAL", safePerfect), "SAFE_RUN")).toBe("SAFE_PERFECT");
    });

    it("stays silent while the run continues or for another kind of question", () => {
      expect(selectChallengeResultOutcome(ended("SAFE_RUN", safePerfect), "SAFE_RUN")).toBeNull();
      expect(selectChallengeResultOutcome(ended("NORMAL", turboWin), "SAFE_RUN")).toBeNull();
      expect(selectChallengeResultOutcome(ended("NORMAL", turboWin), "NORMAL")).toBeNull();
      expect(selectChallengeResultOutcome(ended("NORMAL", null), "TURBO_TRIAL")).toBeNull();
      expect(selectChallengeResultOutcome(null, "TURBO_TRIAL")).toBeNull();
    });
  });

  describe("Safe run progress", () => {
    function safeRun(questionsResolved, overrides = {}) {
      return {
        mode: "SAFE_RUN",
        challenge: {
          run: { challengeId: 9, type: "SAFE_RUN", questionsResolved, totalQuestions: 3, correctAnswers: 0, ...overrides },
        },
      };
    }

    it.each([[0, 1], [1, 2], [2, 3]])("shows question %i resolved as question %i of 3", (resolved, current) => {
      expect(selectSafeRunProgress(safeRun(resolved), "SAFE_RUN")).toEqual({ current, total: 3, resolved });
    });

    it("shows progress only for a Safe question while the server runs Safe", () => {
      expect(selectSafeRunProgress(safeRun(1), "NORMAL")).toBeNull();
      expect(selectSafeRunProgress({ ...safeRun(1), mode: "NORMAL" }, "SAFE_RUN")).toBeNull();
      expect(selectSafeRunProgress(safeRun(1, { type: "TURBO_TRIAL" }), "SAFE_RUN")).toBeNull();
      expect(selectSafeRunProgress({ mode: "SAFE_RUN", challenge: { run: null } }, "SAFE_RUN")).toBeNull();
      expect(selectSafeRunProgress(null, "SAFE_RUN")).toBeNull();
    });

    it("never invents a question past the end of the run", () => {
      expect(selectSafeRunProgress(safeRun(3), "SAFE_RUN")).toBeNull();
    });
  });
});
