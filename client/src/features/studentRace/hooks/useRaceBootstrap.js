import { useCallback } from "react";
import useIntervalWhen from "../../../shared/hooks/useIntervalWhen.js";
import useRacePlayerState from "../../../shared/racePlayer/useRacePlayerState.js";
import { getRaceView, RACE_VIEWS } from "../../../shared/racePlayer/getRaceView.js";
import { isRacePlayerSessionError } from "../../../errors/errorChecks.js";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig.js";
import useStudentRaceSynchronization from "./useStudentRaceSynchronization.js";

export default function useRaceBootstrap({ syncEnabled = true } = {}) {
  const loader = useRacePlayerState();
  const synchronization = useStudentRaceSynchronization({
    raceState: loader.raceState,
    requestError: loader.error,
    silentRefresh: loader.silentRefresh,
    syncEnabled,
  });
  const { runtimeState, prepareAuthoritativeResync } = synchronization;
  const view = runtimeState ? getRaceView(runtimeState) : null;
  const error = loader.error ?? synchronization.error;
  const loaderResync = loader.authoritativeResync;
  const authoritativeResync = useCallback(() => {
    prepareAuthoritativeResync();
    loaderResync();
  }, [prepareAuthoritativeResync, loaderResync]);

  useIntervalWhen(loader.silentRefresh, STUDENT_RACE_CONFIG.raceStatePollMs,
    syncEnabled && view === RACE_VIEWS.PLAYING && !isRacePlayerSessionError(error));

  return { ...synchronization, view, error, isLoading: loader.isLoading,
    retry: loader.retry, authoritativeResync };
}
