export function getLoopPhase(worldOffset, loopWorldLength) {
  const raw = (worldOffset / loopWorldLength) % 1;
  return raw < 0 ? raw + 1 : raw;
}
