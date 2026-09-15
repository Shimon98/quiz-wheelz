import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import {
  TEACHER_CONNECTION_STATES,
  TEACHER_STREAM_STATUSES,
} from "../runtime/teacherRaceLiveConstants";

export function resolveTeacherConnectionState({
  runtime,
  error,
  isOnline,
  recovery,
  streamStatus,
}) {
  if (error) {
    return TEACHER_CONNECTION_STATES.ERROR;
  }

  if (!isOnline) {
    return TEACHER_CONNECTION_STATES.OFFLINE;
  }

  if (runtime?.race.status === RACE_STATUSES.FINISHED) {
    return TEACHER_CONNECTION_STATES.ENDED;
  }

  if (recovery != null || streamStatus === TEACHER_STREAM_STATUSES.RETRYING) {
    return TEACHER_CONNECTION_STATES.RECOVERING;
  }

  if (streamStatus === TEACHER_STREAM_STATUSES.OPEN) {
    return TEACHER_CONNECTION_STATES.LIVE;
  }

  return TEACHER_CONNECTION_STATES.CONNECTING;
}
