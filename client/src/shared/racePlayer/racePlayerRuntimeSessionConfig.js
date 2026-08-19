/*
 * Client transport cadences (C1-05) — never server rules: the 45s presence
 * TTL and 5min reconnect grace stay server-side (RacePlayerRuntimeRules).
 */
export const RACE_PLAYER_RUNTIME_SESSION_CONFIG = Object.freeze({
  // ~3 heartbeats per 45s presence TTL.
  heartbeatIntervalMs: 15000,
  reconnectRetryMs: 5000,
});

// Local connectivity vocabulary — browser OFFLINE is never the server's
// RacePlayerStatus.DISCONNECTED.
export const RACE_PLAYER_CONNECTION_STATES = Object.freeze({
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  RECONNECTING: "RECONNECTING",
  OFFLINE: "OFFLINE",
});
