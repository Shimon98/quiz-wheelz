import { useCallback, useState } from "react";

import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import useIntervalWhen from "../../../shared/hooks/useIntervalWhen";
import { TEACHER_RACE_LIVE_CONFIG } from "../config/teacherRaceLiveConfig";
import {
  estimateServerNowEpochMs,
  resolveRaceElapsedMs,
} from "../utils/teacherServerClock";

export default function useTeacherRaceElapsedTime({ serverClock, race }) {
  const [performanceNowMs, setPerformanceNowMs] = useState(null);

  const tick = useCallback(() => {
    setPerformanceNowMs(performance.now());
  }, []);

  const isTicking =
    serverClock != null &&
    race?.status === RACE_STATUSES.IN_PROGRESS &&
    race?.startedAtEpochMs != null;

  useIntervalWhen(tick, TEACHER_RACE_LIVE_CONFIG.elapsedTickMs, isTicking);

  const serverNowEpochMs = estimateServerNowEpochMs(serverClock, performanceNowMs);

  return {
    elapsedMs: resolveRaceElapsedMs(race, serverNowEpochMs),
    serverNowEpochMs,
  };
}
