export const LIVE_EVENT_VERSION_RELATIONS = Object.freeze({
  STALE: "STALE",
  NEXT: "NEXT",
  GAP: "GAP",
});

export function classifyLiveEventVersion(currentVersion, incomingVersion) {
  if (incomingVersion <= currentVersion) {
    return LIVE_EVENT_VERSION_RELATIONS.STALE;
  }

  if (incomingVersion === currentVersion + 1) {
    return LIVE_EVENT_VERSION_RELATIONS.NEXT;
  }

  return LIVE_EVENT_VERSION_RELATIONS.GAP;
}
