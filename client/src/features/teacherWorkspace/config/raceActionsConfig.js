import { RACE_STATUSES } from "./raceStatusConfig";

/*
 * The primary action of a race row, by status — ONE config every list uses,
 * so "what does clicking a race do" is never re-decided per component.
 *
 * kind:
 *   "room"        — navigate to the race waiting room (real today)
 *   "liveSoon"    — live screen not built yet: honest "coming soon" toast
 *   "summarySoon" — summary screen not built yet: honest "coming soon" toast
 *   "none"        — no action (cancelled races)
 */
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
    kind: "liveSoon",
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
