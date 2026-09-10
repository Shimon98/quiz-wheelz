export function compareRaceSnapshotFreshness(previousVersion, previousTime, incoming) {
  if (previousVersion == null) return 1;
  if (incoming.eventVersion !== previousVersion) {
    return incoming.eventVersion > previousVersion ? 1 : -1;
  }
  if (previousTime == null) return 1;
  return Math.sign(incoming.snapshotAtEpochMs - previousTime);
}
