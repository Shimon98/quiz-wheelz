import { useMemo } from "react";

import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import PixiStudentRaceCanvas from "../pixi/PixiStudentRaceCanvas";
import { applyFeedbackEffectToRuntime } from "../runtime/resolveStudentRaceFeedbackEffect";
import StudentRaceOverlay from "./StudentRaceOverlay";

export default function StudentRaceScreen({
  runtimeState = null,
  ...overlayProps
}) {
  const { gameFrame } = STUDENT_RACE_VISUAL_CONFIG;
  const { feedbackState } = overlayProps;
  const presentationRuntimeState = useMemo(
    () => applyFeedbackEffectToRuntime(runtimeState, feedbackState),
    [runtimeState, feedbackState],
  );

  return (
    <div className="flex h-dvh w-full justify-center bg-[var(--qw-bg)]">
      <div
        className="relative h-full w-full overflow-hidden"
        style={{ maxWidth: gameFrame.maxWidth }}
      >
        <PixiStudentRaceCanvas
          runtimeState={presentationRuntimeState}
          className="absolute inset-0"
        />
        <StudentRaceOverlay runtimeState={runtimeState} {...overlayProps} />
      </div>
    </div>
  );
}
