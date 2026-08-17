import { ApiContractError } from "../../../errors/ApiContractError.js";

/*
 * mapCurrentQuestionToModel — the ONE boundary between the server's
 * StudentQuestionResponse and the question UI. React components consume the
 * client model (question.text, choice.id) and never touch server DTO field
 * names; a broken response fails fast here as ApiContractError instead of
 * `undefined` deep inside the panel.
 *
 * expiresAt arrives as a server-local LocalDateTime string with no timezone
 * (verified in StudentQuestionResponse.java), so Date.parse reads it as
 * device-local time — correct while client and server share a clock (dev),
 * and only ever a DISPLAY concern: the server alone decides real expiry.
 *
 * The model deliberately keeps question/choice ids — C1-03 submits choice.id.
 * Correctness data does not exist in this response (verified server-side)
 * and must never be added to this model.
 */
export function mapCurrentQuestionToModel(response) {
  if (
    response == null ||
    typeof response !== "object" ||
    response.questionId == null ||
    typeof response.questionText !== "string" ||
    response.questionText.length === 0
  ) {
    throw new ApiContractError("Current question response is missing question data");
  }

  if (
    typeof response.timeLimitSeconds !== "number" ||
    response.timeLimitSeconds <= 0
  ) {
    throw new ApiContractError("Current question time limit is invalid");
  }

  const expiresAtMs = Date.parse(response.expiresAt);
  if (!Number.isFinite(expiresAtMs)) {
    throw new ApiContractError("Current question expiry timestamp is invalid");
  }

  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    throw new ApiContractError("Current question choices are missing");
  }

  for (const choice of response.choices) {
    if (
      choice == null ||
      choice.choiceId == null ||
      typeof choice.choiceText !== "string" ||
      choice.choiceText.length === 0 ||
      typeof choice.displayOrder !== "number"
    ) {
      throw new ApiContractError("Current question choice is malformed");
    }
  }

  const uniqueIds = new Set(response.choices.map((choice) => choice.choiceId));
  if (uniqueIds.size !== response.choices.length) {
    throw new ApiContractError("Current question has duplicate choice ids");
  }

  // Server owns the answer order — sort a COPY by displayOrder, never
  // shuffle client-side and never mutate the raw DTO.
  const choices = [...response.choices]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((choice) => ({ id: choice.choiceId, text: choice.choiceText }));

  return {
    id: response.questionId,
    text: response.questionText,
    timeLimitSeconds: response.timeLimitSeconds,
    expiresAtMs,
    choices,
  };
}
