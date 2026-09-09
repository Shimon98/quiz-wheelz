import { ApiContractError } from "../../../errors/ApiContractError.js";
import { assertValidRaceSnapshot } from "./applyRaceSnapshot.js";

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

  const { scoreDelta, snapshot } = response.raceImpact ?? {};
  assertValidRaceSnapshot(snapshot);
  if (!Number.isSafeInteger(scoreDelta)) {
    throw new ApiContractError("Submit answer score delta is invalid");
  }

  return {
    correct: response.correct,
    correctAnswerChoiceId,
    snapshot,
    feedback: {
      questionId: response.questionId,
      correct: response.correct,
      scoreDelta,
      streak: snapshot.streak,
    },
  };
}
