import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { getRaceGameplayPresentation } from "../config/raceGameplayPresentationConfig";
import { STUDENT_RACE_CHALLENGE_PHASE as PHASE } from "../runtime/studentRaceRuntimeConstants";
import { STUDENT_RACE_PANEL_STYLES } from "../styles/studentRacePanelStyles";
import StudentRaceInlineRetryButton from "./StudentRaceInlineRetryButton";
import StudentRacePanelSurface from "./StudentRacePanelSurface";
import "../styles/studentRaceGameplay.css";

const NO_CHOICES = Object.freeze([]);
const SLOW_SUBMIT_STYLE = Object.freeze({ "--race-status-swap-delay": `${STUDENT_RACE_CONFIG.challengeSlowSubmitMs}ms` });

// CSS swaps the lines after the delay, so a fresh SUBMITTING mount restarts it without timers.
function SubmittingLine() {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  return (
    <span className="race-status-swap" style={SLOW_SUBMIT_STYLE}>
      <span className="race-status-swap-first">{t("gameplay.choice.submitting")}</span>
      <span className="race-status-swap-later" aria-hidden="true">{t("gameplay.choice.submittingSlow")}</span>
    </span>
  );
}

// A pending or unverified choice outranks the deadline: it may still have landed in time.
function resolveStatus({ offer, phase, selectedChoice, isExpired }) {
  if (phase === PHASE.SUBMITTING) return { key: "gameplay.choice.submitting" };
  if (phase === PHASE.RECONCILING && selectedChoice != null) return { key: "gameplay.choice.reconciling" };
  if (phase === PHASE.SYNC_FAILED) return { key: "gameplay.choice.syncFailed", canResync: true };
  if (offer == null) return { key: "gameplay.choice.syncing", canResync: phase !== PHASE.RECONCILING };
  if (isExpired) return { key: "gameplay.choice.expired" };
  if (phase === PHASE.RETRY_SAME_CHOICE) return { key: "gameplay.choice.retry" };
  return { key: "gameplay.choice.title" };
}

export default function StudentRaceChallengePanel({
  offer = null,
  phase = PHASE.IDLE,
  selectedChoice = null,
  openChoices = NO_CHOICES,
  isExpired = false,
  interactionEnabled = false,
  onChoose = null,
  onResync = null,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const status = resolveStatus({ offer, phase, selectedChoice, isExpired });
  const cards = (offer?.choices ?? [])
    .map((choice) => ({ choice, presentation: getRaceGameplayPresentation(choice) }))
    .filter(({ presentation }) => presentation != null);
  const canChoose = interactionEnabled && typeof onChoose === "function";

  return (
    <StudentRacePanelSurface>
      <p role="status" className={`${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text)]`}>
        {phase === PHASE.SUBMITTING ? <SubmittingLine /> : <span>{t(status.key)}</span>}
        {status.canResync && interactionEnabled ? (
          <StudentRaceInlineRetryButton onRetry={onResync} labelKey="gameplay.choice.resync" />
        ) : null}
      </p>
      <div className="race-challenge-grid" aria-busy={phase === PHASE.SUBMITTING || phase === PHASE.RECONCILING}>
        {cards.map(({ choice, presentation }) => {
          const open = canChoose && openChoices.includes(choice);
          return (
            <button
              key={choice}
              type="button"
              className="race-challenge-card"
              data-gameplay={choice}
              data-selected={selectedChoice === choice}
              disabled={!open}
              onClick={open ? () => onChoose(choice) : undefined}
            >
              <img className="race-challenge-art" src={presentation.emblemArt} alt="" aria-hidden="true" draggable={false} />
              <span className="race-challenge-title">{t(presentation.titleKey)}</span>
              <span className="race-challenge-description">{t(presentation.descriptionKey)}</span>
            </button>
          );
        })}
      </div>
    </StudentRacePanelSurface>
  );
}
