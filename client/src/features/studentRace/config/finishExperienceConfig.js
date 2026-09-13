export const STUDENT_RACE_FINISH_EXPERIENCE = Object.freeze({
  arbitrationLeadMs: 4000,
  approachRetryMs: 900,
  proofRetryMs: 400,
  releaseGapMs: 120,
  visualHoldUnits: 0.15,
  slowdownDistanceUnits: 6,
  runoutUnits: 6,
});

export const FINISH_EXPERIENCE_PHASES = Object.freeze({
  RACING: "RACING",
  APPROACHING: "APPROACHING",
  AWAITING_AUTHORITY: "AWAITING_AUTHORITY",
  PRESENTING: "PRESENTING",
  COMPLETE: "COMPLETE",
});
