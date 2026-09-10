import { useMemo } from "react";
import { useReducedMotion } from "@mantine/hooks";

import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import PixiStudentRaceCanvas from "../pixi/PixiStudentRaceCanvas";
import { applyFeedbackEffectToRuntime } from "../runtime/resolveStudentRaceFeedbackEffect";
import StudentRaceOverlay from "./StudentRaceOverlay";

export default function StudentRaceScreen({
  runtimeState = null,
  finishPresentation = null,
  ...overlayProps
}) {
  const { gameFrame } = STUDENT_RACE_VISUAL_CONFIG;
  const { feedbackState, answerFeedback } = overlayProps;
  const reducedMotion = useReducedMotion();
  const presentationRuntimeState = useMemo(
    () => applyFeedbackEffectToRuntime(runtimeState, feedbackState, answerFeedback, { reducedMotion }),
    [runtimeState, feedbackState, answerFeedback, reducedMotion],
  );

  return (
    <div className="flex h-dvh w-full justify-center bg-[var(--qw-bg)]">
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          maxWidth: `min(${gameFrame.maxWidth}px, ${
            gameFrame.maxHeightRatio * 100
          }dvh)`,
        }}
      >
        <PixiStudentRaceCanvas
          runtimeState={presentationRuntimeState}
          finishPresentation={finishPresentation}
          className="absolute inset-0"
        />
        <StudentRaceOverlay runtimeState={runtimeState} {...overlayProps} />
      </div>
    </div>
  );
}
