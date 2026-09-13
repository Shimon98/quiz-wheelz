import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import { createLocalStudentRaceRuntime } from "../runtime/localStudentRaceRuntime";
import { mapLocalRuntimeSnapshotToState } from "../runtime/mapLocalRuntimeSnapshotToState";
import { mapSubmitAnswerToModel } from "../runtime/mapSubmitAnswerToModel";
import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants";

const PREVIEW_QUESTION_DURATION_MS = 20000;
const PREVIEW_FEEDBACK_SAMPLES = Object.freeze([
  { id: 1, labelKey: "preview.correct", correct: true, scoreDelta: 10, score: 10, streak: 1 },
  { id: 2, labelKey: "preview.combo", correct: true, scoreDelta: 10, score: 30, streak: 3 },
  { id: 3, labelKey: "preview.strongCombo", correct: true, scoreDelta: 10, score: 50, streak: 5 },
  { id: 4, labelKey: "preview.wrong", correct: false, scoreDelta: 0, score: 50, streak: 0 },
]);
const IDLE_FEEDBACK = Object.freeze({
  feedbackState: STUDENT_RACE_FEEDBACK.IDLE,
  answerFeedback: null,
  selectedChoiceId: null,
  correctAnswerChoiceId: null,
});

function createPreviewState(snapshot) {
  return mapLocalRuntimeSnapshotToState(createInitialRaceRuntimeState(), snapshot);
}

function createPreviewQuestion(id, now) {
  return {
    id,
    timeLimitSeconds: PREVIEW_QUESTION_DURATION_MS / 1000,
    expiresAtEpochMs: now + PREVIEW_QUESTION_DURATION_MS,
    serverClockOffsetMs: 0,
  };
}

export function useStudentRaceVisualPreview(t) {
  const runtime = useMemo(() => createLocalStudentRaceRuntime(), []);
  const [runtimeState, setRuntimeState] = useState(() =>
    createPreviewState(runtime.getSnapshot()),
  );
  const [questionState, setQuestionState] = useState(() => createPreviewQuestion(1, Date.now()));
  const [feedback, setFeedback] = useState(IDLE_FEEDBACK);
  const dwellTimerRef = useRef(null);
  const feedbackActiveRef = useRef(false);
  const question = useMemo(() => ({
    ...questionState,
    text: t("preview.question"),
    choices: PREVIEW_FEEDBACK_SAMPLES.map(({ id, labelKey }) => ({ id, text: t(labelKey) })),
  }), [questionState, t]);

  useEffect(() => {
    const unsubscribe = runtime.subscribe((snapshot) => {
      setRuntimeState((previous) => mapLocalRuntimeSnapshotToState(previous, snapshot));
      setQuestionState((previous) => !feedbackActiveRef.current && Date.now() >= previous.expiresAtEpochMs
        ? createPreviewQuestion(previous.id + 1, Date.now())
        : previous);
    });
    runtime.start();
    return () => {
      runtime.stop();
      unsubscribe();
      clearTimeout(dwellTimerRef.current);
    };
  }, [runtime]);

  const onChoiceSelect = useCallback((choiceId) => {
    if (feedbackActiveRef.current || runtimeState.playerFinished) return;
    const sample = PREVIEW_FEEDBACK_SAMPLES.find(({ id }) => id === choiceId);
    if (sample == null) return;

    const model = mapSubmitAnswerToModel({
      questionId: question.id,
      selectedChoiceId: choiceId,
      correct: sample.correct,
      correctAnswerChoiceId: sample.correct ? null : PREVIEW_FEEDBACK_SAMPLES[0].id,
      raceImpact: {
        scoreDelta: sample.scoreDelta,
        snapshot: {
          ...runtime.getSnapshot(),
          eventVersion: question.id,
          opponents: [],
          score: sample.score,
          streak: sample.streak,
          highestStreak: sample.streak,
          raceFinished: false,
        },
      },
    }, { question, choiceId });
    feedbackActiveRef.current = true;
    setFeedback({
      feedbackState: model.correct ? STUDENT_RACE_FEEDBACK.CORRECT : STUDENT_RACE_FEEDBACK.WRONG,
      answerFeedback: model.feedback,
      selectedChoiceId: choiceId,
      correctAnswerChoiceId: model.correctAnswerChoiceId,
    });
    setRuntimeState((previous) => ({
      ...previous,
      player: { ...previous.player, score: sample.score, streak: sample.streak },
    }));
    dwellTimerRef.current = setTimeout(() => {
      feedbackActiveRef.current = false;
      dwellTimerRef.current = null;
      setFeedback(IDLE_FEEDBACK);
      setQuestionState((previous) => createPreviewQuestion(previous.id + 1, Date.now()));
    }, STUDENT_RACE_CONFIG.feedbackDelayMs);
  }, [question, runtime, runtimeState.playerFinished]);

  return {
    runtimeState,
    question,
    ...feedback,
    interactionEnabled: !runtimeState.playerFinished && feedback.feedbackState === STUDENT_RACE_FEEDBACK.IDLE,
    onChoiceSelect,
  };
}
