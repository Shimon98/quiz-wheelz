import { useEffect, useState } from "react";

import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../config/raceAnimationConfig";

const FINISH_HOLD_MS =
  STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;

export default function useStudentRaceFinishMoment(view) {
  const [tracked, setTracked] = useState({ view, holding: false });
  const transitionHolds =
    tracked.view === RACE_VIEWS.PLAYING && view === RACE_VIEWS.FINISHED;

  if (tracked.view !== view) {
    setTracked({ view, holding: transitionHolds });
  }
  const holding = tracked.view === view ? tracked.holding : transitionHolds;

  useEffect(() => {
    if (!holding) {
      return undefined;
    }
    const timer = setTimeout(
      () => setTracked((previous) => ({ ...previous, holding: false })),
      FINISH_HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [holding]);

  return holding;
}
