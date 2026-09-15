import { TEACHER_CONNECTION_STATES } from "../runtime/teacherRaceLiveConstants";

export const TEACHER_RACE_LIVE_CONFIG = Object.freeze({
  recovery: Object.freeze({
    initialDelayMs: 1000,
    factor: 2,
    maxDelayMs: 15000,
    jitterMs: 300,
    nativeReconnectGraceMs: 8000,
  }),
});

export const TEACHER_CONNECTION_LABEL_KEYS = Object.freeze({
  [TEACHER_CONNECTION_STATES.CONNECTING]: "connection.connecting",
  [TEACHER_CONNECTION_STATES.LIVE]: "connection.live",
  [TEACHER_CONNECTION_STATES.RECOVERING]: "connection.recovering",
  [TEACHER_CONNECTION_STATES.OFFLINE]: "connection.offline",
  [TEACHER_CONNECTION_STATES.ENDED]: "connection.ended",
  [TEACHER_CONNECTION_STATES.ERROR]: "connection.error",
});
