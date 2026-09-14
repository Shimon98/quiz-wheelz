import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import {
  isApiContractError,
  isNotFoundError,
} from "../../../errors/errorChecks";

export const TEACHER_LIVE_VIEWS = Object.freeze({
  LOADING: "LOADING",
  ERROR: "ERROR",
  CONTRACT_ERROR: "CONTRACT_ERROR",
  NOT_FOUND: "NOT_FOUND",
  REDIRECT_ROOM: "REDIRECT_ROOM",
  PROJECTOR: "PROJECTOR",
  CANCELLED: "CANCELLED",
});

const RACE_STATUS_VIEWS = Object.freeze({
  [RACE_STATUSES.WAITING_FOR_PLAYERS]: TEACHER_LIVE_VIEWS.REDIRECT_ROOM,
  [RACE_STATUSES.READY]: TEACHER_LIVE_VIEWS.REDIRECT_ROOM,
  [RACE_STATUSES.IN_PROGRESS]: TEACHER_LIVE_VIEWS.PROJECTOR,
  [RACE_STATUSES.FINISHED]: TEACHER_LIVE_VIEWS.PROJECTOR,
  [RACE_STATUSES.CANCELLED]: TEACHER_LIVE_VIEWS.CANCELLED,
});

function resolveErrorView(error) {
  if (isApiContractError(error)) {
    return TEACHER_LIVE_VIEWS.CONTRACT_ERROR;
  }

  if (isNotFoundError(error)) {
    return TEACHER_LIVE_VIEWS.NOT_FOUND;
  }

  return TEACHER_LIVE_VIEWS.ERROR;
}

export function resolveTeacherLiveView({ isLoading, error, runtime }) {
  if (error) {
    return resolveErrorView(error);
  }

  if (isLoading || runtime == null) {
    return TEACHER_LIVE_VIEWS.LOADING;
  }

  return (
    RACE_STATUS_VIEWS[runtime.race.status] ?? TEACHER_LIVE_VIEWS.CONTRACT_ERROR
  );
}
