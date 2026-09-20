import { RACE_STATUSES } from "./raceStatusConfig";

export const RACE_ACTION_KINDS = Object.freeze({
  ROOM: "room",
  LIVE: "live",
  SUMMARY_SOON: "summarySoon",
  NONE: "none",
});

export const RACE_PRIMARY_ACTIONS = Object.freeze({
  [RACE_STATUSES.WAITING_FOR_PLAYERS]: {
    kind: RACE_ACTION_KINDS.ROOM,
    labelKey: "racesPage.actions.openRoom",
  },
  [RACE_STATUSES.READY]: {
    kind: RACE_ACTION_KINDS.ROOM,
    labelKey: "racesPage.actions.openRoom",
  },
  [RACE_STATUSES.IN_PROGRESS]: {
    kind: RACE_ACTION_KINDS.LIVE,
    labelKey: "racesPage.actions.watchLive",
  },
  [RACE_STATUSES.FINISHED]: {
    kind: RACE_ACTION_KINDS.SUMMARY_SOON,
    labelKey: "racesPage.actions.viewSummary",
  },
  [RACE_STATUSES.CANCELLED]: {
    kind: RACE_ACTION_KINDS.NONE,
    labelKey: "racesPage.actions.cancelled",
  },
});

const UNKNOWN_ACTION = Object.freeze({
  kind: RACE_ACTION_KINDS.NONE,
  labelKey: "racesPage.actions.cancelled",
});

export function getRacePrimaryAction(status) {
  return RACE_PRIMARY_ACTIONS[status] ?? UNKNOWN_ACTION;
}
