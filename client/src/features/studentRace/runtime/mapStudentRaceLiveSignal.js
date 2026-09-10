import { ApiContractError } from "../../../errors/ApiContractError.js";

export function mapStudentRaceLiveSignal(signal) {
  if (!Number.isSafeInteger(signal?.version) || signal.version < 1 ||
      !Number.isSafeInteger(signal.occurredAtEpochMs) || signal.occurredAtEpochMs <= 0 ||
      typeof signal.type !== "string" || signal.type.trim() === "") {
    throw new ApiContractError("Invalid student live signal");
  }
  return { version: signal.version, type: signal.type, occurredAtEpochMs: signal.occurredAtEpochMs };
}
