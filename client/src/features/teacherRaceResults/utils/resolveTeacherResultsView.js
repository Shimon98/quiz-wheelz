import {
  isApiContractError,
  isNotFoundError,
  isRaceResultsNotAvailableError,
} from "../../../errors/errorChecks";

export const TEACHER_RESULTS_VIEWS = Object.freeze({
  LOADING: "LOADING",
  READY: "READY",
  NOT_FOUND: "NOT_FOUND",
  NOT_AVAILABLE: "NOT_AVAILABLE",
  CONTRACT_ERROR: "CONTRACT_ERROR",
  ERROR: "ERROR",
});

function resolveErrorView(error) {
  if (isApiContractError(error)) {
    return TEACHER_RESULTS_VIEWS.CONTRACT_ERROR;
  }

  if (isNotFoundError(error)) {
    return TEACHER_RESULTS_VIEWS.NOT_FOUND;
  }

  if (isRaceResultsNotAvailableError(error)) {
    return TEACHER_RESULTS_VIEWS.NOT_AVAILABLE;
  }

  return TEACHER_RESULTS_VIEWS.ERROR;
}

export function resolveTeacherResultsView({ isLoading, error, results }) {
  if (error) {
    return resolveErrorView(error);
  }

  if (isLoading || results == null) {
    return TEACHER_RESULTS_VIEWS.LOADING;
  }

  return TEACHER_RESULTS_VIEWS.READY;
}
