import { RACE_LIVE_EVENT_TYPES } from "../../../../constants/raceLiveEventConstants";
import {
  mapPlayerFinishedPayload,
  mapPlayerJoinedPayload,
  mapPlayerProgressUpdatedPayload,
  mapQuestionAnsweredPayload,
  mapRaceFinishedPayload,
  mapRaceStartedPayload,
} from "./teacherLiveEventPayloadMappers";
import {
  applyPlayerJoined,
  applyRaceFinished,
  applyRaceStarted,
  applyRosterReplacement,
  applyUnchanged,
} from "./teacherLiveEventAppliers";
import {
  deriveNoFeedItems,
  derivePlayerFinishedFeedItems,
  deriveProgressFeedItems,
  deriveQuestionAnsweredFeedItems,
  deriveRaceFinishedFeedItems,
} from "./teacherLiveFeedDerivers";

export const TEACHER_LIVE_EVENT_REGISTRY = Object.freeze({
  [RACE_LIVE_EVENT_TYPES.PLAYER_JOINED]: {
    mapPayload: mapPlayerJoinedPayload,
    apply: applyPlayerJoined,
    deriveFeedItems: deriveNoFeedItems,
  },
  [RACE_LIVE_EVENT_TYPES.RACE_STARTED]: {
    mapPayload: mapRaceStartedPayload,
    apply: applyRaceStarted,
    deriveFeedItems: deriveNoFeedItems,
  },
  [RACE_LIVE_EVENT_TYPES.QUESTION_ANSWERED]: {
    mapPayload: mapQuestionAnsweredPayload,
    apply: applyUnchanged,
    deriveFeedItems: deriveQuestionAnsweredFeedItems,
  },
  [RACE_LIVE_EVENT_TYPES.PLAYER_PROGRESS_UPDATED]: {
    mapPayload: mapPlayerProgressUpdatedPayload,
    apply: applyRosterReplacement,
    deriveFeedItems: deriveProgressFeedItems,
  },
  [RACE_LIVE_EVENT_TYPES.PLAYER_FINISHED]: {
    mapPayload: mapPlayerFinishedPayload,
    apply: applyRosterReplacement,
    deriveFeedItems: derivePlayerFinishedFeedItems,
  },
  [RACE_LIVE_EVENT_TYPES.RACE_FINISHED]: {
    mapPayload: mapRaceFinishedPayload,
    apply: applyRaceFinished,
    deriveFeedItems: deriveRaceFinishedFeedItems,
  },
});

export function getTeacherLiveEventDefinition(type) {
  return Object.hasOwn(TEACHER_LIVE_EVENT_REGISTRY, type)
    ? TEACHER_LIVE_EVENT_REGISTRY[type]
    : null;
}
