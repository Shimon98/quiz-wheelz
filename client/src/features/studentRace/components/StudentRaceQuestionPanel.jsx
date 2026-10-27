import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";
import { Snail } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { isQuestionUnavailableError } from "../../../errors/errorChecks";
import { getLuckNoticePresentation, getRaceGameplayPresentation } from "../config/raceGameplayPresentationConfig";
import useStudentRaceLuckNotice from "../hooks/useStudentRaceLuckNotice";
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

function SafeProgress({ progress }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  return (
    <span className="race-safe-progress">
      <span>{t("gameplay.safe.progress", { current: progress.current, total: progress.total })}</span>
      <span className="race-safe-pips" aria-hidden="true">
        {Array.from({ length: progress.total }, (_, index) => (
          <span key={index} className="race-safe-pip" data-done={index < progress.resolved} />
        ))}
      </span>
    </span>
  );
}

function IdleLine({ gameplayContext, slowdownNoticeKey, safeProgress, gameplay, announcedLuckEventId }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const luckNotice = getLuckNoticePresentation(useStudentRaceLuckNotice(gameplay, announcedLuckEventId));

  if (slowdownNoticeKey != null) {
    return (
      <p role="status" className={`race-slowdown-notice ${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text)]`}>
        <Snail aria-hidden="true" className="size-4 shrink-0 text-[var(--qw-warning)]" />
        <span>{t(slowdownNoticeKey)}</span>
      </p>
    );
  }

  if (getRaceGameplayPresentation(gameplayContext) != null) {
    return (
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm">
        <StudentRaceGameplayBadge gameplay={gameplayContext} />
        {safeProgress != null ? <SafeProgress progress={safeProgress} /> : null}
      </p>
    );
  }

  // Luck comes only from NORMAL answers, so it stands in for the plain instruction and never for a challenge badge.
  if (luckNotice != null) {
    const LuckIcon = luckNotice.icon;

    return (
      <p role="status" data-tone={luckNotice.tone}
        className={`race-luck-notice ${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text)]`}>
        <LuckIcon aria-hidden="true" className="race-luck-notice-icon size-4 shrink-0" />
        <span>{t(luckNotice.messageKey)}</span>
      </p>
    );
  }

  return (
    <p className="text-center text-sm font-semibold text-[var(--qw-text-muted)]">
      {t("question.instruction")}
    </p>
  );
}

// No usable question is a classroom problem the teacher can fix, so it is named; any other failure keeps the title.
function awaitingErrorKey(error) {
  return isQuestionUnavailableError(error) ? `${I18N_NAMESPACES.ERRORS}:${error.messageKey}` : "question.errorTitle";
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
  slowdownNoticeKey = null,
  safeProgress = null,
  resultFeedbackKey = null,
  gameplay = null,
  announcedLuckEventId = null,
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
            {t(error ? awaitingErrorKey(error) : "question.loadingNext")}
          </span>
          {error ? <StudentRaceInlineRetryButton onRetry={onRetry} /> : null}
        </p>
      ) : showAnswerFeedback ? (
        <p
          role="status"
          className="race-panel-tone text-center text-sm font-bold"
          data-tone={showCorrectFeedback ? "correct" : "wrong"}
        >
          {`${showCorrectFeedback ? "✓" : "✕"} ${t(resultFeedbackKey
            ?? (showCorrectFeedback ? "question.correctFeedback" : "question.wrongFeedback"))}`}
        </p>
      ) : showAnswerSyncError ? (
        <p role="status" className={`${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text-muted)]`}>
          <span>{t("question.answerSyncing")}</span>
          <StudentRaceInlineRetryButton onRetry={onRetry} />
        </p>
      ) : (
        <IdleLine gameplayContext={question.gameplayContext} slowdownNoticeKey={slowdownNoticeKey}
          safeProgress={safeProgress} gameplay={gameplay} announcedLuckEventId={announcedLuckEventId} />
      )}

      <p className="text-center text-3xl font-bold leading-snug text-[var(--qw-text)]">
        <bdi>{question.text}</bdi>
      </p>

      {showExpired ? (
        <div
          role="status"
          className="race-panel-tone flex items-center justify-center gap-2 text-sm font-bold"
          data-tone={error ? "error" : "wrong"}
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
