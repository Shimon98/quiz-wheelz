import { RACE_PLAYER_STATUSES, RACE_STATUSES } from "../../../constants/raceStatusConstants.js";
import { STUDENT_RESULTS_PHASES } from "../config/studentRaceResultsConfig.js";

export function isStudentSelfFinished(runtimeState) {
  return runtimeState?.playerFinished === true || runtimeState?.playerStatus === RACE_PLAYER_STATUSES.FINISHED;
}

export function resolveStudentResultsPhase(runtimeState) {
  if (runtimeState == null || runtimeState.raceStatus === RACE_STATUSES.CANCELLED) {
    return null;
  }

  if (runtimeState.raceFinished === true || runtimeState.raceStatus === RACE_STATUSES.FINISHED) {
    return STUDENT_RESULTS_PHASES.FINAL;
  }

  if (isStudentSelfFinished(runtimeState) && runtimeState.raceStatus === RACE_STATUSES.IN_PROGRESS) {
    return STUDENT_RESULTS_PHASES.WATCHING;
  }

  return null;
}
