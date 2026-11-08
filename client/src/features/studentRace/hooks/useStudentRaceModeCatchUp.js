import { useEffect, useRef } from "react";

import { isQuestionForGameplayMode, isQuestionGameplayMode } from "../runtime/studentRaceGameplayMode";

// When a challenge ends on the server (a technical end included), the next question can arrive before the race state
// that names the new mode, and the screen would show a skeleton until the next poll. A question newer than the last
// snapshot that the snapshot mode does not explain is that case, so the race state is read once for it. An older
// question is simply stale: the question refresh replaces it.
export default function useStudentRaceModeCatchUp({ enabled, question, runtimeState, readAuthoritativeRaceState }) {
  const handledQuestionIdRef = useRef(null);
  const mode = runtimeState?.gameplay?.mode;
  const behindQuestionId = enabled && question != null && isQuestionGameplayMode(mode)
    && !isQuestionForGameplayMode(question, mode)
    && question.serverTimeEpochMs > (runtimeState?.lastSnapshotAtEpochMs ?? 0)
    ? question.id
    : null;

  useEffect(() => {
    if (behindQuestionId == null || handledQuestionIdRef.current === behindQuestionId) return;
    handledQuestionIdRef.current = behindQuestionId;
    readAuthoritativeRaceState().catch(() => {
      // Only a head start: the regular poll still brings the new mode.
    });
  }, [behindQuestionId, readAuthoritativeRaceState]);
}
