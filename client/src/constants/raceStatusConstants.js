/*
 * Race + RacePlayer status values EXACTLY as the server sends them (enums
 * RaceStatus / RacePlayerStatus — data names shared with the backend, do not
 * "prettify"). Hoisted from teacherWorkspace's raceStatusConfig so student
 * features can share them without cross-feature imports; the UI presentation
 * maps (tone/label per status) stay feature-side.
 *
 * UNKNOWN is a client-only fallback for unexpected values — not a server enum.
 */
export const RACE_STATUSES = Object.freeze({
  WAITING_FOR_PLAYERS: "WAITING_FOR_PLAYERS",
  READY: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
  UNKNOWN: "UNKNOWN",
});

export const RACE_PLAYER_STATUSES = Object.freeze({
  WAITING: "WAITING",
  RACING: "RACING",
  FINISHED: "FINISHED",
  DISCONNECTED: "DISCONNECTED",
});

// Server enum RacePlayerReconnectOutcome 1:1 (C1-05). RECONNECT_WINDOW_EXPIRED
// also exists as a heartbeat ERROR name — same fact, two wire paths.
export const RACE_PLAYER_RECONNECT_OUTCOMES = Object.freeze({
  RECONNECTED: "RECONNECTED",
  WAITING_FOR_RACE: "WAITING_FOR_RACE",
  PLAYER_FINISHED: "PLAYER_FINISHED",
  RACE_FINISHED: "RACE_FINISHED",
  ALREADY_DISCONNECTED: "ALREADY_DISCONNECTED",
  RECONNECT_WINDOW_EXPIRED: "RECONNECT_WINDOW_EXPIRED",
});
