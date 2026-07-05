import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import {
  RACE_STATUSES,
  RACE_PLAYER_STATUSES,
} from "../../../constants/raceStatusConstants";

/*
 * Server status values -> workspace UI presentation. The raw status enums
 * were hoisted to src/constants/raceStatusConstants.js (UI-10B) so student
 * features share them; they are re-exported here so existing workspace
 * imports keep working. Every status render in the workspace goes through
 * this config — no per-row status styling.
 */
export { RACE_STATUSES, RACE_PLAYER_STATUSES };

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

// RacePlayer statuses (server domain terms) -> workspace UI presentation.
export const RACE_PLAYER_STATUS_CONFIG = Object.freeze({
  [RACE_PLAYER_STATUSES.WAITING]: {
    tone: UI_TONES.WARNING,
    labelKey: "racePlayerStatus.waiting",
  },
  [RACE_PLAYER_STATUSES.RACING]: {
    tone: UI_TONES.SUCCESS,
    labelKey: "racePlayerStatus.racing",
  },
  [RACE_PLAYER_STATUSES.FINISHED]: {
    tone: UI_TONES.INFO,
    labelKey: "racePlayerStatus.finished",
  },
  [RACE_PLAYER_STATUSES.DISCONNECTED]: {
    tone: UI_TONES.NEUTRAL,
    labelKey: "racePlayerStatus.disconnected",
  },
});

export function getRacePlayerStatusConfig(status) {
  return (
    RACE_PLAYER_STATUS_CONFIG[status] ??
    RACE_PLAYER_STATUS_CONFIG[RACE_PLAYER_STATUSES.WAITING]
  );
}
