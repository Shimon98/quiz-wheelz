import { ApiContractError } from "../../../../errors/ApiContractError";
import {
  classifyLiveEventVersion,
  LIVE_EVENT_VERSION_RELATIONS,
} from "../../../../shared/live/classifyLiveEventVersion";
import {
  TEACHER_LIVE_EVENT_OUTCOMES,
  TEACHER_LIVE_RECOVERY_REASONS,
} from "../teacherRaceLiveConstants";
import { getTeacherLiveEventDefinition } from "./teacherLiveEventRegistry";

function unchanged(runtime, kind) {
  return { kind, runtime, feedItems: [], recoveryReason: null };
}

function recoveryRequired(runtime, recoveryReason) {
  return {
    kind: TEACHER_LIVE_EVENT_OUTCOMES.RECOVERY_REQUIRED,
    runtime,
    feedItems: [],
    recoveryReason,
  };
}

function applied(runtime, feedItems) {
  return {
    kind: TEACHER_LIVE_EVENT_OUTCOMES.APPLIED,
    runtime,
    feedItems,
    recoveryReason: null,
  };
}

function runKnownDefinition(definition, runtime, event) {
  const mappedEvent = {
    raceId: event.raceId,
    version: event.version,
    type: event.type,
    occurredAtEpochMs: event.occurredAtEpochMs,
    payload: definition.mapPayload(event.rawPayload),
  };
  const nextRuntime = {
    ...definition.apply(runtime, mappedEvent),
    eventVersion: event.version,
  };

  return applied(
    nextRuntime,
    definition.deriveFeedItems(runtime, mappedEvent, nextRuntime),
  );
}

export function applyTeacherLiveEvent(runtime, event) {
  if (event.raceId !== runtime.race.raceId) {
    return recoveryRequired(runtime, TEACHER_LIVE_RECOVERY_REASONS.RACE_MISMATCH);
  }

  const relation = classifyLiveEventVersion(runtime.eventVersion, event.version);

  if (relation === LIVE_EVENT_VERSION_RELATIONS.STALE) {
    return unchanged(runtime, TEACHER_LIVE_EVENT_OUTCOMES.STALE);
  }

  if (relation === LIVE_EVENT_VERSION_RELATIONS.GAP) {
    return recoveryRequired(runtime, TEACHER_LIVE_RECOVERY_REASONS.VERSION_GAP);
  }

  const definition = getTeacherLiveEventDefinition(event.type);

  if (definition == null) {
    return applied({ ...runtime, eventVersion: event.version }, []);
  }

  try {
    return runKnownDefinition(definition, runtime, event);
  } catch (error) {
    if (error instanceof ApiContractError) {
      return recoveryRequired(
        runtime,
        TEACHER_LIVE_RECOVERY_REASONS.MALFORMED_PAYLOAD,
      );
    }

    throw error;
  }
}
