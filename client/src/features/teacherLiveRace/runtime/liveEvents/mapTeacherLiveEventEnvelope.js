import {
  requireNonEmptyString,
  requireObject,
  requireSafeInteger,
} from "../../../../errors/apiContractGuards";

export function mapTeacherLiveEventEnvelope(raw) {
  requireObject(raw, "Teacher live event");

  return {
    raceId: requireSafeInteger(raw.raceId, "Teacher live event raceId", {
      min: 1,
    }),
    version: requireSafeInteger(raw.version, "Teacher live event version", {
      min: 1,
    }),
    type: requireNonEmptyString(raw.type, "Teacher live event type"),
    occurredAtEpochMs: requireSafeInteger(
      raw.occurredAtEpochMs,
      "Teacher live event occurredAtEpochMs",
      { min: 1 },
    ),
    rawPayload: raw.payload,
  };
}
