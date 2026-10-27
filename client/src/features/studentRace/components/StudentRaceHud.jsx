import { useTranslation } from "react-i18next";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { RACE_RESULTS_ART } from "../../../shared/raceResults/raceResultsArt";
import { RACE_CHALLENGE_ART } from "../config/raceChallengeArt";
import { getStudentRaceHudModel } from "../utils/getStudentRaceHudModel";
import StudentRaceQuestionTimer from "./StudentRaceQuestionTimer";
import StudentRaceSpeedometer from "./StudentRaceSpeedometer";
import StudentRaceReward from "./StudentRaceReward";
import "../styles/studentRaceHud.css";

function HudStatChip({ art, label, value, accessibleLabel, sharedRank = false }) {
  return (
    <div className="race-hud-stat" aria-label={accessibleLabel} data-shared-rank={sharedRank}>
      <div className="race-hud-stat-label">
        <img className="race-hud-stat-art" src={art} alt="" aria-hidden="true" draggable={false} />
        <span>{label}</span>
      </div>
      <span className="race-hud-stat-value" dir="ltr" title={value}>{value}</span>
    </div>
  );
}

function HudCountdown({ question, challengeOffer }) {
  if (challengeOffer != null) return <StudentRaceQuestionTimer {...challengeOffer} labelKey="timer.challengeLabel" />;
  if (question != null) return <StudentRaceQuestionTimer {...question} />;
  return <span aria-hidden="true" />;
}

export default function StudentRaceHud({
  runtimeState = null,
  question = null,
  challengeOffer = null,
  answerFeedback = null,
  controls = null,
}) {
  const { t, i18n } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const hud = getStudentRaceHudModel(runtimeState, i18n.resolvedLanguage, answerFeedback);

  if (hud == null) return null;

  return (
    <div className="student-race-hud" style={hud.style} data-reward={hud.reward != null}>
      <div className="race-hud-top">
        <HudStatChip
          key={hud.rewardKey}
          art={RACE_RESULTS_ART.stats.score}
          label={t("hud.scoreLabel")}
          value={hud.scoreText}
        />
        <HudCountdown question={question} challengeOffer={challengeOffer} />
        {hud.rankText != null ? (
          <HudStatChip
            art={hud.rankArt}
            label={t(hud.rankLabelKey)}
            value={hud.rankText}
            sharedRank={hud.sharedRank}
            accessibleLabel={t(hud.rankValueKey, { rank: hud.rank, count: hud.playerCount })}
          />
        ) : <span aria-hidden="true" />}
      </div>
      <div className="race-hud-telemetry">
        <div
          key={hud.rewardKey}
          className="race-hud-combo"
          data-active={hud.isCombo}
          data-celebrating={hud.reward != null}
          aria-label={t("hud.streakValue", { count: hud.streak })}
        >
          <img
            className="race-hud-combo-art"
            src={RACE_RESULTS_ART.stats.streak}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <div className="race-hud-combo-copy">
            <span className="race-hud-combo-label">{t(hud.streakLabelKey)}</span>
            <strong dir="ltr">{hud.streakText}</strong>
          </div>
        </div>
        <div className="race-hud-progress">
          {hud.progressPercent != null ? (
            <>
              <div className="race-hud-progress-caption">
                <span>{t("hud.progressShortLabel")}</span>
                <span dir="ltr" aria-hidden="true">{hud.progressText}</span>
              </div>
              <div
                className="race-hud-progress-track"
                role="progressbar"
                aria-label={t("hud.progressLabel")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={hud.progressPercent}
              >
                <div className="race-hud-progress-fill" style={hud.progressStyle} />
              </div>
            </>
          ) : null}
          {hud.energy != null ? (
            <div
              className="race-hud-energy"
              data-full={hud.energy.full}
              role="progressbar"
              aria-label={t("hud.energyLabel")}
              aria-valuemin={0}
              aria-valuemax={hud.energy.max}
              aria-valuenow={hud.energy.value}
              aria-valuetext={t("hud.energyValue", { value: hud.energy.value, max: hud.energy.max })}
            >
              <img className="race-hud-energy-art" src={RACE_CHALLENGE_ART.energy} alt="" aria-hidden="true" draggable={false} />
              <div className="race-hud-energy-track">
                <div className="race-hud-energy-fill" style={hud.energy.style} />
              </div>
              <span className="race-hud-energy-value" dir="ltr" aria-hidden="true">{hud.energy.text}</span>
            </div>
          ) : null}
        </div>
        <StudentRaceSpeedometer speed={hud.speed} slowing={hud.slowing} />
        {controls}
      </div>
      {/* The shield bubble lives only in Pixi. One live line that stays mounted is announced when the shield comes
          up and never again while the race moves; the panel already tells when the shield blocks mud. */}
      <span className="sr-only" aria-live="polite">{hud.shieldUp ? t("hud.shieldReady") : null}</span>
      <StudentRaceReward key={hud.rewardKey} reward={hud.reward} />
    </div>
  );
}
