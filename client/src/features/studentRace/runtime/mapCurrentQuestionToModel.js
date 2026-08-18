import { ApiContractError } from "../../../errors/ApiContractError.js";

/*
 * mapCurrentQuestionToModel — the ONE boundary between the server's
 * StudentQuestionResponse and the question UI. React components consume the
 * client model (question.text, choice.id) and never touch server DTO field
 * names; a broken response fails fast here as ApiContractError instead of
 * `undefined` deep inside the panel.
 *
 * Timing contract (C1-02K): the wire carries absolute Unix epoch
 * milliseconds — expiresAtEpochMs (the authoritative deadline) and
 * serverTimeEpochMs (the server clock at response construction). The mapper
 * derives serverClockOffsetMs so consumers can estimate the server's "now"
 * from Date.now() regardless of device timezone/clock skew. No date-string
 * parsing exists anymore; the server alone still decides real expiry.
 *
 * The model deliberately keeps question/choice ids — C1-03 submits choice.id.
 * Correctness data does not exist in this response (verified server-side)
 * and must never be added to this model.
 */
export function mapCurrentQuestionToModel(
  response,
  clientReceivedAtEpochMs = Date.now(),
) {
  if (
    response == null ||
    typeof response !== "object" ||
    response.questionId == null ||
    typeof response.questionText !== "string" ||
    response.questionText.trim().length === 0
  ) {
    throw new ApiContractError("Current question response is missing question data");
  }

  if (
    !Number.isSafeInteger(response.timeLimitSeconds) ||
    response.timeLimitSeconds <= 0
  ) {
    throw new ApiContractError("Current question time limit is invalid");
  }

  if (
    !Number.isSafeInteger(response.serverTimeEpochMs) ||
    response.serverTimeEpochMs <= 0
  ) {
    throw new ApiContractError("Current question server time is invalid");
  }

  if (
    !Number.isSafeInteger(response.expiresAtEpochMs) ||
    response.expiresAtEpochMs <= 0
  ) {
    throw new ApiContractError("Current question expiry timestamp is invalid");
  }

  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    throw new ApiContractError("Current question choices are missing");
  }

  const choiceIds = new Set();
  const displayOrders = new Set();

  for (const choice of response.choices) {
    if (
      choice == null ||
      choice.choiceId == null ||
      typeof choice.choiceText !== "string" ||
      choice.choiceText.trim().length === 0 ||
      !Number.isSafeInteger(choice.displayOrder) ||
      choice.displayOrder <= 0
    ) {
      throw new ApiContractError("Current question choice is malformed");
    }

    if (choiceIds.has(choice.choiceId)) {
      throw new ApiContractError("Current question has duplicate choice ids");
    }

    if (displayOrders.has(choice.displayOrder)) {
      throw new ApiContractError("Current question has duplicate display orders");
    }

    choiceIds.add(choice.choiceId);
    displayOrders.add(choice.displayOrder);
  }

  // Server owns the answer order — sort a COPY by displayOrder, never
  // shuffle client-side and never mutate the raw DTO.
  const choices = [...response.choices]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((choice) => ({ id: choice.choiceId, text: choice.choiceText.trim() }));

  return {
    id: response.questionId,
    text: response.questionText.trim(),
    timeLimitSeconds: response.timeLimitSeconds,
    expiresAtEpochMs: response.expiresAtEpochMs,
    serverClockOffsetMs: response.serverTimeEpochMs - clientReceivedAtEpochMs,
    choices,
  };
}
