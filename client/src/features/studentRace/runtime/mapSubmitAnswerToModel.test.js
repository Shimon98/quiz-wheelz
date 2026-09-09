import { describe, expect, it } from "vitest";

import { ApiContractError } from "../../../errors/ApiContractError";
import { mapSubmitAnswerToModel } from "./mapSubmitAnswerToModel";

const question = { id: 17, choices: [{ id: 1 }, { id: 2 }] };
const request = { question, choiceId: 1 };

function response({ correct = true, scoreDelta = 15, streak = 4, ...overrides } = {}) {
  return {
    questionId: question.id,
    selectedChoiceId: 1,
    correct,
    correctAnswerChoiceId: correct ? null : 2,
    raceImpact: {
      scoreDelta,
      progressDelta: 15,
      snapshot: {
        streak,
        score: 80,
        speed: 1.3,
        position: 110,
        highestStreak: streak,
        totalDistance: 1000,
        movementUnitsPerSecond: 5.2,
        snapshotAtEpochMs: 10000,
        raceStatus: "IN_PROGRESS",
        playerStatus: "RACING",
        playerFinished: false,
        raceFinished: false,
      },
    },
    ...overrides,
  };
}

describe("mapSubmitAnswerToModel accepted feedback", () => {
  it("carries the accepted answer identity and values without deriving them from totals", () => {
    const source = response();
    const result = mapSubmitAnswerToModel(source, request);

    expect(result.feedback).toEqual({ questionId: 17, correct: true, scoreDelta: 15, streak: 4 });
    expect(result.snapshot).toBe(source.raceImpact.snapshot);
    expect(result.correctAnswerChoiceId).toBeNull();
    expect(source.raceImpact.snapshot.position).toBe(110);
  });

  it("preserves an accepted wrong answer and its revealed choice", () => {
    const result = mapSubmitAnswerToModel(response({ correct: false, scoreDelta: 0, streak: 0 }), request);

    expect(result.feedback).toEqual({ questionId: 17, correct: false, scoreDelta: 0, streak: 0 });
    expect(result.correctAnswerChoiceId).toBe(2);
  });

  it.each([-20, 0, 10])("preserves signed authoritative score delta %s", (scoreDelta) => {
    expect(mapSubmitAnswerToModel(response({ scoreDelta }), request).feedback.scoreDelta).toBe(scoreDelta);
  });

  it.each([null, undefined, "15", 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects malformed consumed score delta %s",
    (scoreDelta) => {
      const source = response();
      source.raceImpact.scoreDelta = scoreDelta;
      expect(() => mapSubmitAnswerToModel(source, request)).toThrow(ApiContractError);
    },
  );

  it.each([null, undefined, "4", -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects malformed consumed streak %s",
    (streak) => {
      const source = response();
      source.raceImpact.snapshot.streak = streak;
      expect(() => mapSubmitAnswerToModel(source, request)).toThrow(ApiContractError);
    },
  );

  it.each([
    { questionId: 18 },
    { selectedChoiceId: 2 },
    { correct: "true" },
    { correctAnswerChoiceId: 1 },
    { raceImpact: null },
    { raceImpact: { scoreDelta: 10 } },
  ])("rejects incompatible accepted-answer responses %o", (overrides) => {
    expect(() => mapSubmitAnswerToModel(response(overrides), request)).toThrow(ApiContractError);
  });

  it.each(["speed", "playerFinished", "raceFinished"])(
    "validates the whole accepted snapshot before exposing feedback when %s is missing", (field) => {
      const source = response();
      delete source.raceImpact.snapshot[field];

      expect(() => mapSubmitAnswerToModel(source, request)).toThrow(ApiContractError);
    },
  );

  it("does not invent a revealed choice for a wrong answer", () => {
    expect(() => mapSubmitAnswerToModel(response({ correct: false, correctAnswerChoiceId: 99 }), request))
      .toThrow(ApiContractError);
  });

  it("preserves the final snapshot and does not reinterpret its last progress award", () => {
    const source = response({ scoreDelta: 20, streak: 7 });
    source.raceImpact.snapshot = { ...source.raceImpact.snapshot, position: 1000, playerFinished: true };

    const result = mapSubmitAnswerToModel(source, request);
    expect(result.snapshot).toBe(source.raceImpact.snapshot);
    expect(result.feedback).toEqual({ questionId: 17, correct: true, scoreDelta: 20, streak: 7 });
  });
});
