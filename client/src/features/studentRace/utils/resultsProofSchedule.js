import { STUDENT_RACE_RESULTS_CONFIG as CONFIG } from "../config/studentRaceResultsConfig.js";

export function resolveResultsProofStaggerMs(racePlayerId) {
  return (racePlayerId % CONFIG.proofStaggerBuckets) * CONFIG.proofStaggerStepMs;
}

export function resolveResultsProofDelayMs(attempt, racePlayerId) {
  const backoffMs = Math.min(CONFIG.proofBaseDelayMs * CONFIG.proofBackoffFactor ** attempt, CONFIG.proofMaxBackoffMs);

  return backoffMs + resolveResultsProofStaggerMs(racePlayerId);
}
