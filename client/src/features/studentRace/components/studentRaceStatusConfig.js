import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";

/*
 * Status vocabulary + content map for StudentRaceStatusView (own file so the
 * component module exports only components — react-refresh rule).
 */

// Page-side vocabulary for the two non-view states.
export const STUDENT_RACE_STATUSES = Object.freeze({
  LOADING: "loading",
  ERROR: "error",
});

// status -> studentRace namespace keys + behavior flags (config over ifs).
export const STUDENT_RACE_STATUS_CONTENT = Object.freeze({
  [STUDENT_RACE_STATUSES.LOADING]: {
    titleKey: "status.loadingTitle",
    bodyKey: "status.loadingBody",
    withLoader: true,
  },
  [RACE_VIEWS.WAITING]: {
    titleKey: "status.waitingTitle",
    bodyKey: "status.waitingBody",
  },
  [RACE_VIEWS.FINISHED]: {
    titleKey: "status.finishedTitle",
    bodyKey: "status.finishedBody",
  },
  [RACE_VIEWS.CANCELLED]: {
    titleKey: "status.cancelledTitle",
    bodyKey: "status.cancelledBody",
  },
  [RACE_VIEWS.DISCONNECTED]: {
    titleKey: "status.disconnectedTitle",
    bodyKey: "status.disconnectedBody",
    withRetry: true,
  },
  [RACE_VIEWS.UNKNOWN]: {
    titleKey: "status.unknownTitle",
    bodyKey: "status.unknownBody",
    withRetry: true,
  },
});
