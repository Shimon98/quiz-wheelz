export function computeRecoveryDelayMs(attempt, recoveryConfig, jitterFraction) {
  const baseDelayMs = Math.min(
    recoveryConfig.initialDelayMs * recoveryConfig.factor ** attempt,
    recoveryConfig.maxDelayMs,
  );

  return Math.round(baseDelayMs + recoveryConfig.jitterMs * jitterFraction);
}
