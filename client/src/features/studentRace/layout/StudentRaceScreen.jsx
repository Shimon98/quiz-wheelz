import { useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@mantine/hooks";

import { AudioSettingsButton } from "../../../shared/components/publicSettings";

import { playStudentRaceMoments } from "../audio/studentRaceSounds";
import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import useStudentRaceMoments from "../hooks/useStudentRaceMoments";
import useStudentRaceSound from "../hooks/useStudentRaceSound";
import PixiStudentRaceCanvas from "../pixi/PixiStudentRaceCanvas";
import { newestLuckEventId, newestRankMoment, raceIdentityOf } from "../runtime/deriveStudentRaceMoments";
import { applyFeedbackEffectToRuntime } from "../runtime/resolveStudentRaceFeedbackEffect";
import { STUDENT_RACE_MOMENT } from "../runtime/studentRaceRuntimeConstants";
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
  const [announcedLuckEventId, setAnnouncedLuckEventId] = useState(null);
  const [announcedRank, setAnnouncedRank] = useState(null);
  const rewardUntilRef = useRef(0);
  const momentConsumers = useMemo(
    () => [
      (batch) => canvasRef.current?.playMoments(batch),
      playStudentRaceMoments,
      // The text line tells one-shot Luck only as announced here, like the kart and the sound.
      (batch) => {
        const eventId = newestLuckEventId(batch);
        if (eventId != null) setAnnouncedLuckEventId(eventId);
      },
      // C5-05: a told climb is stamped once, when it arrives here, never again on a later render.
      // Option B (2026-11-05): a correct answer's reward card covers the notice line for the answer's dwell, so a
      // climb told while it shows starts on the line once the card is gone, and then has its full time.
      (batch) => {
        const now = Date.now();
        if (batch.moments.some(({ type }) => type === STUDENT_RACE_MOMENT.CORRECT)) {
          rewardUntilRef.current = now + STUDENT_RACE_CONFIG.feedbackDelayMs;
        }
        const rankMoment = newestRankMoment(batch);
        if (rankMoment != null) {
          setAnnouncedRank({
            ...rankMoment,
            announcedAtEpochMs: now,
            showFromEpochMs: Math.max(now, rewardUntilRef.current),
          });
        }
      },
    ],
    [],
  );
  useStudentRaceMoments(presentationRuntimeState, momentConsumers);
  // Rank news belongs to the race player it was told for and never plays over the finish. A climb the player loses
  // again is dropped, on the render that sees the loss (React's pattern for state that follows other state; it runs
  // once): a close race may take the place back while the reward card shows or while the line tells it, and the line
  // never tells a place the player no longer holds. Winning it back inside the 5 s gap tells nothing again: the moments
  // pipeline mutes that climb.
  const playerRank = runtimeState?.player?.rank;
  const forThisPlayer = announcedRank != null && announcedRank.identity === raceIdentityOf(runtimeState);
  if (forThisPlayer && Number.isSafeInteger(playerRank) && playerRank > announcedRank.rank) {
    setAnnouncedRank(null);
  }
  const rankNews = forThisPlayer && runtimeState?.playerFinished !== true ? announcedRank : null;
  useStudentRaceSound({
    engineActive: interactionEnabled === true && runtimeState?.playerFinished !== true,
    speed: runtimeState?.visual?.targetSpeed,
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
          announcedLuckEventId={announcedLuckEventId}
          rankNews={rankNews}
          hudControls={<AudioSettingsButton size="md" className="pointer-events-auto" />}
          {...overlayProps}
        />
      </div>
    </div>
  );
}
