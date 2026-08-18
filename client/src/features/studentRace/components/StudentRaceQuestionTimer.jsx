import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TimerIcon } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { getQuestionRemainingMs } from "../runtime/questionTiming";

/*
 * StudentRaceQuestionTimer — the ONE question countdown chip, already in its
 * final C1-04 HUD position ([SCORE] [TIMER] [STREAK] later fills around it).
 *
 * Pure presentation of an absolute server deadline: every tick recomputes
 * remaining time via the SHARED getQuestionRemainingMs formula (epoch
 * deadline + server clock calibration — the same one the expiry hook
 * schedules with), so background-tab throttling, refreshes, device timezone
 * or a skewed device clock can never drift it. It owns its OWN tick state so
 * the rest of the race screen does not re-render four times a second; expiry
 * POLICY (locking, server resync) lives in useStudentRaceQuestion, never
 * here.
 *
 * No aria-live: announcing every second would spam screen readers. The
 * panel announces "time's up" once instead.
 */

// Urgency is presentation only — the server remains the expiry authority.
function resolveAccentVar(remainingSeconds, timer) {
  if (remainingSeconds <= timer.dangerSeconds) {
    return "var(--qw-red)";
  }
  if (remainingSeconds <= timer.warningSeconds) {
    return "var(--qw-gold)";
  }
  return "var(--qw-primary)";
}

export default function StudentRaceQuestionTimer({
  expiresAtEpochMs,
  serverClockOffsetMs,
  timeLimitSeconds,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const { timer } = STUDENT_RACE_CONFIG;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, timer.tickMs);

    return () => {
      clearInterval(interval);
    };
  }, [timer.tickMs]);

  const remainingMs = getQuestionRemainingMs(
    { expiresAtEpochMs, serverClockOffsetMs },
    now,
  );
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, Math.max(0, remainingMs / (timeLimitSeconds * 1000)));
  const accentVar = resolveAccentVar(remainingSeconds, timer);

  return (
    <div
      className="mx-auto flex w-fit min-w-[5.5rem] flex-col items-center gap-1 rounded-full bg-[var(--qw-surface)] px-4 py-1.5 shadow-[var(--qw-shadow-sm)]"
      aria-label={t("timer.label")}
    >
      <div className="flex items-center gap-1.5" dir="ltr">
        <TimerIcon size={18} style={{ color: accentVar }} aria-hidden="true" />
        <span
          className="text-lg font-bold leading-none tabular-nums"
          style={{ color: accentVar }}
        >
          {remainingSeconds}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--qw-border)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: accentVar,
          }}
        />
      </div>
    </div>
  );
}
