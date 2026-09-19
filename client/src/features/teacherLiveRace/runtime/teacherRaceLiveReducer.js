import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import { TEACHER_LIVE_FEED_CONFIG } from "../config/teacherLiveFeedConfig";
import { applyTeacherLiveEvent } from "./liveEvents/applyTeacherLiveEvent";
import { TEACHER_LIVE_EVENT_OUTCOMES } from "./teacherRaceLiveConstants";

const EMPTY_EVENTS = Object.freeze([]);

export const TEACHER_LIVE_ACTIONS = Object.freeze({
  AUTHORITATIVE_STATE_LOADED: "AUTHORITATIVE_STATE_LOADED",
  LIVE_EVENT_RECEIVED: "LIVE_EVENT_RECEIVED",
  RECOVERY_REQUESTED: "RECOVERY_REQUESTED",
});

export const INITIAL_TEACHER_LIVE_STATE = Object.freeze({
  raceId: null,
  runtime: null,
  serverClock: null,
  recentEvents: EMPTY_EVENTS,
  recovery: null,
  loadCount: 0,
});

function requestRecovery(state, reason) {
  const isRecoverable =
    state.runtime != null &&
    state.runtime.race.status !== RACE_STATUSES.FINISHED &&
    state.recovery == null;

  return isRecoverable ? { ...state, recovery: { reason } } : state;
}

function receiveLiveEvent(state, event) {
  if (state.runtime == null) {
    return state;
  }

  const result = applyTeacherLiveEvent(state.runtime, event);

  if (result.kind === TEACHER_LIVE_EVENT_OUTCOMES.STALE) {
    return state;
  }

  if (result.kind === TEACHER_LIVE_EVENT_OUTCOMES.RECOVERY_REQUIRED) {
    return requestRecovery(state, result.recoveryReason);
  }

  return {
    ...state,
    runtime: result.runtime,
    recentEvents: [...result.feedItems, ...state.recentEvents].slice(
      0,
      TEACHER_LIVE_FEED_CONFIG.maxItems,
    ),
  };
}

function loadAuthoritativeState(state, action) {
  return {
    raceId: action.raceId,
    runtime: action.runtime,
    serverClock: {
      serverTimeEpochMs: action.runtime.serverTimeEpochMs,
      receivedAtPerformanceNow: action.receivedAtPerformanceNow,
    },
    recentEvents:
      action.raceId === state.raceId ? state.recentEvents : EMPTY_EVENTS,
    recovery: null,
    loadCount: state.loadCount + 1,
  };
}

export function teacherRaceLiveReducer(state, action) {
  switch (action.type) {
    case TEACHER_LIVE_ACTIONS.AUTHORITATIVE_STATE_LOADED:
      return loadAuthoritativeState(state, action);
    case TEACHER_LIVE_ACTIONS.LIVE_EVENT_RECEIVED:
      return receiveLiveEvent(state, action.event);
    case TEACHER_LIVE_ACTIONS.RECOVERY_REQUESTED:
      return requestRecovery(state, action.reason);
    default:
      return state;
  }
}
