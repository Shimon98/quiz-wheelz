import { useMemo, useRef } from "react";
import { useReducedMotion } from "@mantine/hooks";

import { AudioSettingsButton } from "../../../shared/components/publicSettings";

import { playStudentRaceMoments } from "../audio/studentRaceSounds";
import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import useStudentRaceMoments from "../hooks/useStudentRaceMoments";
import useStudentRaceSound from "../hooks/useStudentRaceSound";
import PixiStudentRaceCanvas from "../pixi/PixiStudentRaceCanvas";
import { applyFeedbackEffectToRuntime } from "../runtime/resolveStudentRaceFeedbackEffect";
import { isQuestionTimeUp } from "../utils/isQuestionTimeUp";
import StudentRaceOverlay from "./StudentRaceOverlay";

export default function StudentRaceScreen({
  runtimeState = null,
  finishPresentation = null,
  ...overlayProps
}) {
  const { gameFrame } = STUDENT_RACE_VISUAL_CONFIG;
  const { feedbackState, answerFeedback, question, questionExpired, isSubmitting, interactionEnabled } = overlayProps;
  const reducedMotion = useReducedMotion();
  const timeUpQuestionId = isQuestionTimeUp({ isExpired: questionExpired, feedbackState, isSubmitting })
    ? question?.id ?? null
    : null;
  const presentationRuntimeState = useMemo(
    () => applyFeedbackEffectToRuntime(runtimeState, feedbackState, answerFeedback, { reducedMotion, timeUpQuestionId }),
    [runtimeState, feedbackState, answerFeedback, reducedMotion, timeUpQuestionId],
  );
  const canvasRef = useRef(null);
  const momentConsumers = useMemo(
    () => [(batch) => canvasRef.current?.playMoments(batch), playStudentRaceMoments],
    [],
  );
  useStudentRaceMoments(presentationRuntimeState, momentConsumers);
  useStudentRaceSound({
    engineActive: interactionEnabled === true && runtimeState?.playerFinished !== true,
    speed: runtimeState?.player?.speed,
  });

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
          ref={canvasRef}
          runtimeState={presentationRuntimeState}
          finishPresentation={finishPresentation}
          className="absolute inset-0"
        />
        <StudentRaceOverlay
          runtimeState={runtimeState}
          hudControls={<AudioSettingsButton size="md" className="pointer-events-auto" />}
          {...overlayProps}
        />
      </div>
    </div>
  );
}
