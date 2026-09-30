export const STUDENT_RESULTS_PHASES = Object.freeze({
  WATCHING: "WATCHING",
  FINAL: "FINAL",
});

export const STUDENT_RESULT_GROUPS = Object.freeze({
  RANKED: "ranked",
  CONFIRMING: "confirming",
  RACING: "racing",
  OUT: "out",
});

export const STUDENT_RACE_RESULTS_CONFIG = Object.freeze({
  watchPollMs: 5000,
  proofBaseDelayMs: 1500,
  proofBackoffFactor: 2,
  proofMaxBackoffMs: 15000,
  proofStaggerStepMs: 150,
  proofStaggerBuckets: 8,
});
