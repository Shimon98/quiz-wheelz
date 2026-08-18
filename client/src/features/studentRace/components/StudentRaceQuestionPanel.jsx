import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";

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
    interactionEnabled && !isExpired && typeof onChoiceSelect === "function";

  return (
    <PanelSurface>
      <p className="text-center text-sm font-semibold text-[var(--qw-text-muted)]">
        {t("question.instruction")}
      </p>

      {/* bdi isolates the math expression from the surrounding RTL flow:
          "7 × 8 = ?" keeps LTR order, future Hebrew wording stays RTL. */}
      <p className="text-center text-3xl font-bold leading-snug text-[var(--qw-text)]">
        <bdi>{question.text}</bdi>
      </p>

      {isExpired ? (
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

      <div
        className={`grid flex-1 grid-cols-2 gap-3 ${
          isExpired ? "opacity-50" : ""
        }`}
      >
        {question.choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            disabled={!canInteract}
            onClick={canInteract ? () => onChoiceSelect(choice.id) : undefined}
            className="flex min-h-[3.75rem] items-center justify-center rounded-xl border-b-4 bg-[var(--qw-surface-alt)] px-3 py-2 text-center text-2xl font-bold text-[var(--qw-text)] disabled:cursor-default"
            style={{
              borderColor:
                CHOICE_ACCENT_VARS[index % CHOICE_ACCENT_VARS.length],
            }}
          >
            <bdi>{choice.text}</bdi>
          </button>
        ))}
      </div>
    </PanelSurface>
  );
}
