import { UI_TONES } from "../../../app/theme/quizWheelzTheme";

/*
 * Race status values as the server sends them (data names shared with the
 * backend — do not "prettify" these), mapped once to UI presentation.
 * Every status render in the workspace goes through this config — no
 * per-row status styling.
 */
export const RACE_STATUSES = Object.freeze({
  WAITING_FOR_PLAYERS: "WAITING_FOR_PLAYERS",
  READY: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
  UNKNOWN: "UNKNOWN",
});

// tone = Mantine palette name via UI_TONES; labelKey = teacherWorkspace i18n key.
// READY sits in the "waiting" tone family — a ready race is still pre-launch.
export const RACE_STATUS_CONFIG = Object.freeze({
  [RACE_STATUSES.WAITING_FOR_PLAYERS]: {
    tone: UI_TONES.WARNING,
    labelKey: "raceStatus.waiting",
  },
  [RACE_STATUSES.READY]: {
    tone: UI_TONES.WARNING,
    labelKey: "raceStatus.ready",
  },
  [RACE_STATUSES.IN_PROGRESS]: {
    tone: UI_TONES.SUCCESS,
    labelKey: "raceStatus.active",
  },
  [RACE_STATUSES.FINISHED]: {
    tone: UI_TONES.INFO,
    labelKey: "raceStatus.finished",
  },
  [RACE_STATUSES.CANCELLED]: {
    tone: UI_TONES.DANGER,
    labelKey: "raceStatus.cancelled",
  },
  [RACE_STATUSES.UNKNOWN]: {
    tone: UI_TONES.NEUTRAL,
    labelKey: "raceStatus.unknown",
  },
});

export function getRaceStatusConfig(status) {
  return (
    RACE_STATUS_CONFIG[status] ?? RACE_STATUS_CONFIG[RACE_STATUSES.UNKNOWN]
  );
}
