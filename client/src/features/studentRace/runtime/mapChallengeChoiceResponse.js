import { ApiContractError } from "../../../errors/ApiContractError.js";
import { requireObject, requireSafeInteger } from "../../../errors/apiContractGuards.js";
import { assertValidRaceSnapshot } from "./applyRaceSnapshot.js";

export function mapChallengeChoiceResponse(response, { offerId, choice }) {
  requireObject(response, "Challenge choice response");

  if (response.offerId !== offerId || response.choice !== choice) {
    throw new ApiContractError("Challenge choice response does not match the request");
  }

  requireSafeInteger(response.selectedAtEpochMs, "Challenge choice time", { min: 1 });
  assertValidRaceSnapshot(response.snapshot);
  return response.snapshot;
}
