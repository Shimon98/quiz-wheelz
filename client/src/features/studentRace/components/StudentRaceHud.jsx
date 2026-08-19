import { useTranslation } from "react-i18next";
import { StarIcon, TrophyIcon, ZapIcon } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { getRaceProgressRatio } from "../utils/getRaceProgressRatio";
import StudentRaceQuestionTimer from "./StudentRaceQuestionTimer";

/*
 * StudentRaceHud (C1-04) — presentation-only view of server-owned gameplay
 * state inside the HUD safe area:
 *
 *   [SCORE]        [TIMER]        [STREAK]
 *   [ progress bar ──────── %   ⚡ speed ]
 *
 * Every number comes straight from runtimeState (applyRaceSnapshot output);
 * no game rules, no local counters. The timer stays the ONE existing
 * StudentRaceQuestionTimer. Deliberately absent until their server
 * contracts exist: rank (S1-02), effect badge (no authoritative
 * activeEffect on the wire yet), currentDifficulty (not core HUD).
 */

function HudStatChip({ icon: Icon, label, accentVar, children }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[var(--qw-surface)] px-3 py-1.5 shadow-[var(--qw-shadow-sm)]">
      <Icon size={16} style={{ color: accentVar }} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <span
        className="text-base font-bold leading-none tabular-nums text-[var(--qw-text)]"
        dir="ltr"
      >
        {children}
      </span>
    </div>
  );
}

export default function StudentRaceHud({ runtimeState = null, question = null }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  if (!runtimeState) {
    return null;
  }

  const { score, streak, speed } = runtimeState.player;
  const progressRatio = getRaceProgressRatio(
    runtimeState.player.position,
    runtimeState.totalDistance,
  );
  const progressPercent =
    progressRatio == null ? null : Math.round(progressRatio * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="justify-self-start">
          <HudStatChip
            icon={TrophyIcon}
            label={t("hud.scoreLabel")}
            accentVar="var(--qw-gold)"
          >
            {score}
          </HudStatChip>
        </div>
        {question ? (
          <StudentRaceQuestionTimer
            expiresAtEpochMs={question.expiresAtEpochMs}
            serverClockOffsetMs={question.serverClockOffsetMs}
            timeLimitSeconds={question.timeLimitSeconds}
          />
        ) : (
          <span aria-hidden="true" />
        )}
        <div className="justify-self-end">
          <HudStatChip
            icon={StarIcon}
            label={t("hud.streakLabel")}
            accentVar="var(--qw-accent)"
          >
            {`×${streak}`}
          </HudStatChip>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-[var(--qw-surface)] px-3 py-1 shadow-[var(--qw-shadow-sm)]">
        {progressPercent != null ? (
          <>
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--qw-border)]"
              role="progressbar"
              aria-label={t("hud.progressLabel")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <div
                className="h-full rounded-full bg-[var(--qw-primary)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span
              className="text-xs font-bold leading-none tabular-nums text-[var(--qw-text)]"
              dir="ltr"
              aria-hidden="true"
            >
              {progressPercent}%
            </span>
          </>
        ) : (
          // Honest UI: no totalDistance yet → no invented progress.
          <span className="min-w-0 flex-1" aria-hidden="true" />
        )}
        {Number.isFinite(speed) ? (
          <span className="flex items-center gap-1">
            <ZapIcon
              size={14}
              style={{ color: "var(--qw-primary)" }}
              aria-hidden="true"
            />
            <span className="sr-only">{t("hud.speedLabel")}</span>
            <span
              className="text-xs font-bold leading-none tabular-nums text-[var(--qw-text)]"
              dir="ltr"
            >
              {`×${speed.toFixed(1)}`}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
