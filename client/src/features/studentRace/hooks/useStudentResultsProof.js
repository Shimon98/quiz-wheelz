import { useEffect } from "react";

import { STUDENT_RESULTS_PHASES } from "../config/studentRaceResultsConfig.js";
import { resolveResultsProofDelayMs } from "../utils/resultsProofSchedule.js";
import { resolveStudentResultsPhase } from "../utils/studentRaceResultsStatus.js";
import { resolveUnconfirmedFinisherKey } from "../utils/resolveUnconfirmedFinisherKey.js";

export default function useStudentResultsProof({ enabled, runtimeState, finishOrder, requestFinishArbitration }) {
  const watching = enabled && resolveStudentResultsPhase(runtimeState) === STUDENT_RESULTS_PHASES.WATCHING;
  const pendingKey = watching ? resolveUnconfirmedFinisherKey(runtimeState, finishOrder) : "";
  const ownId = runtimeState?.player?.racePlayerId ?? null;

  useEffect(() => {
    if (pendingKey === "" || ownId == null) {
      return undefined;
    }

    let cancelled = false;
    let timer = null;

    function schedule(attempt) {
      timer = setTimeout(async () => {
        try {
          await requestFinishArbitration();
        } finally {
          if (!cancelled) {
            schedule(attempt + 1);
          }
        }
      }, resolveResultsProofDelayMs(attempt, ownId));
    }

    schedule(0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pendingKey, ownId, requestFinishArbitration]);
}
