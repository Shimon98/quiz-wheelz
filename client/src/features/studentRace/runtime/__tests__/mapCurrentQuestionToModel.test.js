import { describe, expect, it } from "vitest";

import { ApiContractError } from "../../../../errors/ApiContractError";
import { mapCurrentQuestionToModel } from "../mapCurrentQuestionToModel";

const RECEIVED_AT_EPOCH_MS = 100500;

function questionResponse(overrides = {}) {
  return {
    questionId: 87,
    gameplayContext: "NORMAL",
    questionText: "6 + 6 = ?",
    timeLimitSeconds: 30,
    serverTimeEpochMs: 100000,
    expiresAtEpochMs: 130000,
    choices: [
      { choiceId: 102, choiceText: "10", displayOrder: 2 },
      { choiceId: 101, choiceText: "12", displayOrder: 1 },
    ],
    ...overrides,
  };
}

describe("mapCurrentQuestionToModel gameplay context", () => {
  it("carries the server's gameplay context next to the unchanged question model", () => {
    expect(mapCurrentQuestionToModel(questionResponse(), RECEIVED_AT_EPOCH_MS)).toEqual({
      id: 87,
      gameplayContext: "NORMAL",
      text: "6 + 6 = ?",
      timeLimitSeconds: 30,
      expiresAtEpochMs: 130000,
      serverClockOffsetMs: -500,
      choices: [{ id: 101, text: "12" }, { id: 102, text: "10" }],
    });
  });

  it.each(["TURBO_TRIAL", "SAFE_RUN", "FUTURE_CONTEXT"])("preserves the %s context", (gameplayContext) => {
    expect(mapCurrentQuestionToModel(questionResponse({ gameplayContext }), RECEIVED_AT_EPOCH_MS).gameplayContext)
      .toBe(gameplayContext);
  });

  it.each([undefined, null])("treats a missing context (%s) as a normal question", (gameplayContext) => {
    expect(mapCurrentQuestionToModel(questionResponse({ gameplayContext }), RECEIVED_AT_EPOCH_MS).gameplayContext)
      .toBe("NORMAL");
  });

  it.each(["", "  ", 7])("rejects a present but invalid context: %o", (gameplayContext) => {
    expect(() => mapCurrentQuestionToModel(questionResponse({ gameplayContext }), RECEIVED_AT_EPOCH_MS))
      .toThrow(ApiContractError);
  });
});
