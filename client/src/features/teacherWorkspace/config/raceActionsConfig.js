import { RACE_STATUSES } from "./raceStatusConfig";

export const RACE_PRIMARY_ACTIONS = Object.freeze({
  [RACE_STATUSES.WAITING_FOR_PLAYERS]: {
    kind: "room",
    labelKey: "racesPage.actions.openRoom",
  },
  [RACE_STATUSES.READY]: {
    kind: "room",
    labelKey: "racesPage.actions.openRoom",
  },
  [RACE_STATUSES.IN_PROGRESS]: {
    kind: "live",
    labelKey: "racesPage.actions.watchLive",
  },
  [RACE_STATUSES.FINISHED]: {
    kind: "summarySoon",
    labelKey: "racesPage.actions.viewSummary",
  },
  [RACE_STATUSES.CANCELLED]: {
    kind: "none",
    labelKey: "racesPage.actions.cancelled",
  },
});

const UNKNOWN_ACTION = Object.freeze({
  kind: "none",
  labelKey: "racesPage.actions.cancelled",
});

export function getRacePrimaryAction(status) {
  return RACE_PRIMARY_ACTIONS[status] ?? UNKNOWN_ACTION;
}
