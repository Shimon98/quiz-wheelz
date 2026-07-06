import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";

/*
 * The persistent question panel SHELL (layout contract, G): geometry and
 * surface only — the real question text, answer buttons, timer and the
 * studentRace i18n namespace land in UI-10I.
 *
 * The height mirrors resolveStudentRaceLayoutMetrics EXACTLY (same config
 * values, same clamp — CSS here, JS there), so the DOM panel and the Pixi
 * kart anchor can never disagree.
 *
 * Skeleton blocks only — no text, no fake game data (honest-UI rule).
 */
export default function StudentRaceQuestionPanelShell() {
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
      <div className="flex h-full w-full flex-col gap-4 rounded-t-[1.75rem] bg-[var(--qw-surface)] p-5 shadow-[var(--qw-shadow-card)]">
        {/* Skeleton: question line (real content arrives in UI-10I). */}
        <div className="mx-auto mt-1 h-9 w-3/5 rounded-lg bg-[var(--qw-border)] opacity-40" />
        {/* Skeleton: the 2x2 answers grid. */}
        <div className="grid flex-1 grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
          <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
          <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
          <div className="rounded-xl bg-[var(--qw-border)] opacity-30" />
        </div>
      </div>
    </div>
  );
}
