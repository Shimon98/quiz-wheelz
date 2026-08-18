import {
  RACE_STATUSES,
  RACE_PLAYER_STATUSES,
} from "../../constants/raceStatusConstants.js";

/*
 * Client-only view vocabulary — what the UI should show for the current
 * RacePlayer, resolved ONCE from the authoritative server state. These are
 * NOT server enums: the server says IN_PROGRESS + RACING, the client says
 * PLAYING. Shared because the waiting flow and the race screen interpret
 * the exact same four fields.
 */
export const RACE_VIEWS = Object.freeze({
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
  DISCONNECTED: "DISCONNECTED",
  UNKNOWN: "UNKNOWN",
});

/*
 * getRaceView — pure interpretation of authoritative server state. Accepts
 * any object carrying { raceStatus, playerStatus, playerFinished,
 * raceFinished } — a runtime state or a snapshot-shaped object alike.
 *
 * Priority order (deliberate):
 *   CANCELLED → FINISHED → DISCONNECTED → WAITING → PLAYING → UNKNOWN
 * FINISHED beats DISCONNECTED on purpose: a race that is already over is
 * over, regardless of how the player left it. Any combination we do not
 * explicitly recognize is UNKNOWN — the client never fabricates game truth.
 */
export function getRaceView(state) {
  const raceStatus = state?.raceStatus;
  const playerStatus = state?.playerStatus;

  if (raceStatus === RACE_STATUSES.CANCELLED) {
    return RACE_VIEWS.CANCELLED;
  }

  if (
    state?.raceFinished === true ||
    state?.playerFinished === true ||
    raceStatus === RACE_STATUSES.FINISHED ||
    playerStatus === RACE_PLAYER_STATUSES.FINISHED
  ) {
    return RACE_VIEWS.FINISHED;
  }

  if (playerStatus === RACE_PLAYER_STATUSES.DISCONNECTED) {
    return RACE_VIEWS.DISCONNECTED;
  }

  if (
    (raceStatus === RACE_STATUSES.WAITING_FOR_PLAYERS ||
      raceStatus === RACE_STATUSES.READY) &&
    playerStatus === RACE_PLAYER_STATUSES.WAITING
  ) {
    return RACE_VIEWS.WAITING;
  }

  if (
    raceStatus === RACE_STATUSES.IN_PROGRESS &&
    playerStatus === RACE_PLAYER_STATUSES.RACING
  ) {
    return RACE_VIEWS.PLAYING;
  }

  return RACE_VIEWS.UNKNOWN;
}
