import { RACE_LIVE_EVENT_TYPES } from "../../../constants/raceLiveEventConstants";
import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import { TEACHER_LIVE_FEED_CONFIG } from "../config/teacherLiveFeedConfig";
import { estimateServerNowEpochMs } from "../utils/teacherServerClock";
import { applyTeacherLiveEvent } from "./liveEvents/applyTeacherLiveEvent";
import { admitFeedItems, EMPTY_FEED_ADMISSION } from "./liveEvents/teacherFeedAdmission";
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
  feedAdmission: EMPTY_FEED_ADMISSION,
  heldAnswerRows: EMPTY_EVENTS,
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

function receiveLiveEvent(state, { event, receivedAtPerformanceNow }) {
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

  // An answer's QUESTION_ANSWERED event is followed, in the same transaction, by the progress or finish event with
  // the server's new ranks and streaks. Its rows wait for that event, so the feed tells one row per answer, the
  // strongest: the answer's own moment, then a lead, a streak or a climb, and only then a plain correct answer.
  if (event.type === RACE_LIVE_EVENT_TYPES.QUESTION_ANSWERED) {
    return {
      ...state,
      runtime: result.runtime,
      heldAnswerRows: [...state.heldAnswerRows, ...result.feedItems],
    };
  }

  // The race always takes the event; the feed takes only the rows that are still news at a calm pace (C5-05).
  const { admitted, memory } = admitFeedItems(state.feedAdmission, [...state.heldAnswerRows, ...result.feedItems], {
    occurredAtEpochMs: event.occurredAtEpochMs,
    eventAgeMs:
      estimateServerNowEpochMs(state.serverClock, receivedAtPerformanceNow) -
      event.occurredAtEpochMs,
  });

  return {
    ...state,
    runtime: result.runtime,
    feedAdmission: memory,
    heldAnswerRows: EMPTY_EVENTS,
    recentEvents:
      admitted.length === 0
        ? state.recentEvents
        : [...admitted, ...state.recentEvents].slice(0, TEACHER_LIVE_FEED_CONFIG.maxItems),
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
    feedAdmission:
      action.raceId === state.raceId ? state.feedAdmission : EMPTY_FEED_ADMISSION,
    // A reload replaces the race: a waiting answer is judged against the new baseline, never told later.
    heldAnswerRows: EMPTY_EVENTS,
    recovery: null,
    loadCount: state.loadCount + 1,
  };
}

export function teacherRaceLiveReducer(state, action) {
  switch (action.type) {
    case TEACHER_LIVE_ACTIONS.AUTHORITATIVE_STATE_LOADED:
      return loadAuthoritativeState(state, action);
    case TEACHER_LIVE_ACTIONS.LIVE_EVENT_RECEIVED:
      return receiveLiveEvent(state, action);
    case TEACHER_LIVE_ACTIONS.RECOVERY_REQUESTED:
      return requestRecovery(state, action.reason);
    default:
      return state;
  }
}
