import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants";

/*
 * StudentRaceQuestionPanel — the production question panel (C1-02, replaces
 * the UI-10G skeleton shell; the geometry wrapper is IDENTICAL so the DOM
 * panel and the Pixi kart anchor still agree via
 * resolveStudentRaceLayoutMetrics).
 *
 * Presentation only: the page/hooks own HTTP, expiry policy and navigation.
 * Panel-level loading/error keep the race world alive behind it — the
 * question is a child resource of the screen, never the screen itself.
 *
 * C1-02 renders the real question and choices with interaction DISABLED —
 * clicking answers becomes real in C1-03 via onChoiceSelect (the prop
 * contract already exists so C1-03 only flips interactionEnabled and passes
 * the handler; no structural change).
 */

// The design system's answer-option palette (tokens.css: --qw-blue/violet/
// amber, answer green reuses --qw-green). Decorative identity only — NEVER
// correctness; C1-03 layers server-driven correct/wrong feedback separately.
const CHOICE_ACCENT_VARS = [
  "var(--qw-blue)",
  "var(--qw-violet)",
  "var(--qw-amber)",
  "var(--qw-green)",
];

function PanelSurface({ children }) {
  const { questionPanel } = STUDENT_RACE_VISUAL_CONFIG.layout;

  return (
    <div
      className="pointer-events-auto w-full"
      style={{
        height: `clamp(${questionPanel.minHeight}px, ${
          questionPanel.heightRatio * 100
        }dvh, ${questionPanel.maxHeight}px)`,
        paddingInlineStart: questionPanel.sideInset,
        paddingInlineEnd: questionPanel.sideInset,
      }}
    >
      <div className="flex h-full w-full flex-col gap-3 rounded-t-[1.75rem] bg-[var(--qw-surface)] p-5 shadow-[var(--qw-shadow-card)]">
        {children}
      </div>
    </div>
  );
}

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

export default function StudentRaceQuestionPanel({
  question = null,
  error = null,
  isExpired = false,
  interactionEnabled = false,
  onChoiceSelect = null,
  onRetry = null,
  // C1-03 answer feedback — server-driven correctness presentation.
  selectedChoiceId = null,
  correctAnswerChoiceId = null,
  feedbackState = STUDENT_RACE_FEEDBACK.IDLE,
  isSubmitting = false,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  if (!question) {
    if (error) {
      return (
        <PanelSurface>
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
        </PanelSurface>
      );
    }

    return (
      <PanelSurface>
        <QuestionSkeleton />
      </PanelSurface>
    );
  }

  // A button may only be live when ALL hold — interactionEnabled without a
  // real callback must never render an enabled button that does nothing.
  const canInteract =
    interactionEnabled &&
    !isExpired &&
    !isSubmitting &&
    feedbackState === STUDENT_RACE_FEEDBACK.IDLE &&
    typeof onChoiceSelect === "function";

  const showCorrectFeedback = feedbackState === STUDENT_RACE_FEEDBACK.CORRECT;
  const showWrongFeedback = feedbackState === STUDENT_RACE_FEEDBACK.WRONG;
  const showAnswerFeedback = showCorrectFeedback || showWrongFeedback;
  // Answer feedback / an in-flight submit outrank expiry presentation — the
  // server already decided; a timer that hit zero mid-flight must not paint
  // "time up" over a real result (no contradictory UI).
  const showExpired =
    !showAnswerFeedback &&
    !isSubmitting &&
    (isExpired || feedbackState === STUDENT_RACE_FEEDBACK.EXPIRED);
  const showAnswerSyncError =
    feedbackState === STUDENT_RACE_FEEDBACK.ERROR && !showExpired;

  return (
    <PanelSurface>
      {/* One stable line: instruction ↔ feedback swap in place, so the
          answer grid never shifts (small-screen layout contract). Glyphs +
          text carry the result — never color alone. */}
      {showAnswerFeedback ? (
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
        <p
          role="status"
          className="flex items-center justify-center gap-2 text-center text-sm font-bold text-[var(--qw-text-muted)]"
        >
          <span>{t("question.answerSyncing")}</span>
          {onRetry ? (
            <Button
              size="compact-sm"
              variant="light"
              color={UI_TONES.DANGER}
              onClick={onRetry}
            >
              {t("status.retry")}
            </Button>
          ) : null}
        </p>
      ) : (
        <p className="text-center text-sm font-semibold text-[var(--qw-text-muted)]">
          {t("question.instruction")}
        </p>
      )}

      {/* bdi isolates the math expression from the surrounding RTL flow:
          "7 × 8 = ?" keeps LTR order, future Hebrew wording stays RTL. */}
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
          {error && onRetry ? (
            <Button
              size="compact-sm"
              variant="light"
              color={UI_TONES.DANGER}
              onClick={onRetry}
            >
              {t("status.retry")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* auto-rows-fr + min-h-0 buttons: rows split the available panel
          height equally, so the legal 6-choice case (3 rows) fits 360x640
          instead of clipping below the fold; with 4 choices the rows are
          simply taller. */}
      <div
        className={`grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 ${
          showExpired ? "opacity-50" : ""
        }`}
      >
        {question.choices.map((choice, index) => {
          const isSelected = choice.id === selectedChoiceId;
          // Server-driven correctness only: the child's correct pick, or the
          // revealed correct answer after a wrong pick.
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
              {/* Glyph mark, never color alone; the status line above
                  carries the accessible result text. */}
              {markCorrect ? <span aria-hidden="true">✓</span> : null}
              {markWrong ? <span aria-hidden="true">✕</span> : null}
              <bdi>{choice.text}</bdi>
            </button>
          );
        })}
      </div>
    </PanelSurface>
  );
}
