const clamp = (value) => Math.max(0, Math.min(1, value));
export const smoothstep = (value) => value * value * (3 - 2 * value);

export function advanceFinishRunout(runout, deltaMs) {
  runout.elapsedMs = Math.min(runout.durationMs, runout.elapsedMs + Math.max(0, deltaMs));
  const progress = clamp(runout.elapsedMs / runout.durationMs);
  if (progress <= 0.5) {
    return runout.start + (runout.finishLine - runout.start) * smoothstep(progress * 2);
  }
  return runout.finishLine + (runout.target - runout.finishLine) * smoothstep((progress - 0.5) * 2);
}
