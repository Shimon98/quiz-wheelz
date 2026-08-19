import { ApiContractError } from "../../../errors/ApiContractError.js";

/*
 * mapSubmitAnswerToModel — the ONE boundary between the server's
 * SubmitAnswerResponse and the answer flow. It receives the submitted
 * question model + choiceId so identity ("this response answers what we
 * asked") and correct-answer membership ("the revealed correct choice
 * belongs to that question") are enforced here — feedback can never paint a
 * choice on the wrong question.
 *
 * Deliberately validates ONLY what C1-03 consumes: correctness + the
 * authoritative snapshot (deep-validated by applyRaceSnapshot, the shared
 * snapshot owner). Unconsumed wire fields (questionStatus, timing echoes,
 * scoreDelta/progressDelta) are not validated or returned — they join the
 * model when a consumer exists (C1-04 HUD).
 */
export function mapSubmitAnswerToModel(response, { question, choiceId }) {
  if (response == null || typeof response !== "object") {
    throw new ApiContractError("Submit answer response is missing");
  }

  if (
    response.questionId !== question.id ||
    response.selectedChoiceId !== choiceId
  ) {
    throw new ApiContractError("Submit answer response does not match request");
  }

  if (typeof response.correct !== "boolean") {
    throw new ApiContractError("Submit answer correctness flag is missing");
  }

  // Server contract: null on correct, the real correct choice id on wrong.
  const correctAnswerChoiceId = response.correctAnswerChoiceId ?? null;

  if (response.correct) {
    if (correctAnswerChoiceId != null) {
      throw new ApiContractError("Submit answer leaked a correct-answer id");
    }
  } else if (
    !question.choices.some((choice) => choice.id === correctAnswerChoiceId)
  ) {
    throw new ApiContractError("Submit answer correct choice is unknown");
  }

  if (response.raceImpact?.snapshot == null) {
    throw new ApiContractError("Submit answer race snapshot is missing");
  }

  return {
    correct: response.correct,
    correctAnswerChoiceId,
    snapshot: response.raceImpact.snapshot,
  };
}
