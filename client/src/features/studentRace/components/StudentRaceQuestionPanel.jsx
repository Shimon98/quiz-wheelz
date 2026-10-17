import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";
import { Snail } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { getRaceGameplayPresentation } from "../config/raceGameplayPresentationConfig";
import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants";
import { STUDENT_RACE_PANEL_STYLES } from "../styles/studentRacePanelStyles";
import { isQuestionTimeUp } from "../utils/isQuestionTimeUp";
import StudentRaceGameplayBadge from "./StudentRaceGameplayBadge";
import StudentRaceInlineRetryButton from "./StudentRaceInlineRetryButton";
import StudentRacePanelSurface from "./StudentRacePanelSurface";

const CHOICE_ACCENT_VARS = [
  "var(--qw-blue)",
  "var(--qw-violet)",
  "var(--qw-amber)",
  "var(--qw-green)",
];

function QuestionSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4" aria-busy="true">
      <div className="mx-auto mt-1 h-9 w-3/5 rounded-lg bg-[var(--qw-border)] opacity-40" />
      <div className="grid flex-1 grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
        <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
        <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
        <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
      </div>
    </div>
  );
}

function IdleLine({ gameplayContext, slowdownNotice }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  if (slowdownNotice) {
    return (
      <p role="status" className={`${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text)]`}>
        <Snail aria-hidden="true" className="size-4 shrink-0 text-[var(--qw-warning)]" />
        <span>{t("gameplay.slowdownNotice")}</span>
      </p>
    );
  }

  if (getRaceGameplayPresentation(gameplayContext) != null) {
    return (
      <p className="text-center text-sm">
        <StudentRaceGameplayBadge gameplay={gameplayContext} />
      </p>
    );
  }

  return (
    <p className="text-center text-sm font-semibold text-[var(--qw-text-muted)]">
      {t("question.instruction")}
    </p>
  );
}

export default function StudentRaceQuestionPanel({
  question = null,
  error = null,
  isExpired = false,
  interactionEnabled = false,
  onChoiceSelect = null,
  onRetry = null,
  selectedChoiceId = null,
  correctAnswerChoiceId = null,
  feedbackState = STUDENT_RACE_FEEDBACK.IDLE,
  isSubmitting = false,
  isAwaitingNextQuestion = false,
  slowdownNotice = false,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  if (!question) {
    if (error) {
      return (
        <StudentRacePanelSurface>
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-bold text-[var(--qw-text)]">
              {t("question.errorTitle")}
            </p>
            {error.messageKey ? (
              <p className="text-sm text-[var(--qw-text-muted)]">
                {t(`${I18N_NAMESPACES.ERRORS}:${error.messageKey}`)}
              </p>
            ) : null}
            {onRetry ? (
              <Button variant="light" color={UI_TONES.DANGER} onClick={onRetry}>
                {t("status.retry")}
              </Button>
            ) : null}
          </div>
        </StudentRacePanelSurface>
      );
    }

    return (
      <StudentRacePanelSurface>
        <QuestionSkeleton />
      </StudentRacePanelSurface>
    );
  }

  const canInteract =
    interactionEnabled &&
    !isExpired &&
    !isSubmitting &&
    feedbackState === STUDENT_RACE_FEEDBACK.IDLE &&
    typeof onChoiceSelect === "function";

  const showCorrectFeedback = feedbackState === STUDENT_RACE_FEEDBACK.CORRECT;
  const showWrongFeedback = feedbackState === STUDENT_RACE_FEEDBACK.WRONG;
  const showAnswerFeedback = showCorrectFeedback || showWrongFeedback;
  const showExpired = isQuestionTimeUp({ isExpired, feedbackState, isSubmitting });
  const showAnswerSyncError =
    feedbackState === STUDENT_RACE_FEEDBACK.ERROR && !showExpired;

  return (
    <StudentRacePanelSurface gameplay={question.gameplayContext}>
      {isAwaitingNextQuestion ? (
        <p role="status" className={`${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text-muted)]`}>
          <span>
            {t(error ? "question.errorTitle" : "question.loadingNext")}
          </span>
          {error ? <StudentRaceInlineRetryButton onRetry={onRetry} /> : null}
        </p>
      ) : showAnswerFeedback ? (
        <p
          role="status"
          className="text-center text-sm font-bold"
          style={{
            color: showCorrectFeedback ? "var(--qw-green)" : "var(--qw-gold)",
          }}
        >
          {showCorrectFeedback
            ? `✓ ${t("question.correctFeedback")}`
            : `✕ ${t("question.wrongFeedback")}`}
        </p>
      ) : showAnswerSyncError ? (
        <p role="status" className={`${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text-muted)]`}>
          <span>{t("question.answerSyncing")}</span>
          <StudentRaceInlineRetryButton onRetry={onRetry} />
        </p>
      ) : (
        <IdleLine gameplayContext={question.gameplayContext} slowdownNotice={slowdownNotice} />
      )}

      <p className="text-center text-3xl font-bold leading-snug text-[var(--qw-text)]">
        <bdi>{question.text}</bdi>
      </p>

      {showExpired ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 text-sm font-bold"
          style={{ color: error ? "var(--qw-red)" : "var(--qw-gold)" }}
        >
          <span>{t(error ? "question.syncError" : "question.timeUp")}</span>
          {error ? <StudentRaceInlineRetryButton onRetry={onRetry} /> : null}
        </div>
      ) : null}

      <div
        className={`grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 ${
          showExpired ? "opacity-50" : ""
        }`}
      >
        {question.choices.map((choice, index) => {
          const isSelected = choice.id === selectedChoiceId;
          const markCorrect =
            (showCorrectFeedback && isSelected) ||
            (showWrongFeedback && choice.id === correctAnswerChoiceId);
          const markWrong = showWrongFeedback && isSelected;
          const isDimmed =
            (isSubmitting || showAnswerFeedback) && !isSelected && !markCorrect;

          return (
            <button
              key={choice.id}
              type="button"
              disabled={!canInteract}
              onClick={
                canInteract ? () => onChoiceSelect(choice.id) : undefined
              }
              className={`flex min-h-0 items-center justify-center gap-2 rounded-xl border-b-4 bg-[var(--qw-surface-alt)] px-3 py-2 text-center text-2xl font-bold text-[var(--qw-text)] transition-transform disabled:cursor-default ${
                isSubmitting && isSelected ? "scale-95" : ""
              } ${isDimmed ? "opacity-60" : ""}`}
              style={{
                borderColor: markCorrect
                  ? "var(--qw-green)"
                  : markWrong
                    ? "var(--qw-red)"
                    : CHOICE_ACCENT_VARS[index % CHOICE_ACCENT_VARS.length],
                boxShadow: markCorrect
                  ? "inset 0 0 0 2px var(--qw-green)"
                  : markWrong
                    ? "inset 0 0 0 2px var(--qw-red)"
                    : undefined,
              }}
            >
              {markCorrect ? <span aria-hidden="true">✓</span> : null}
              {markWrong ? <span aria-hidden="true">✕</span> : null}
              <bdi>{choice.text}</bdi>
            </button>
          );
        })}
      </div>
    </StudentRacePanelSurface>
  );
}
