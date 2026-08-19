import { useTranslation } from "react-i18next";
import { RefreshCwIcon, WifiOffIcon } from "lucide-react";

import { I18N_NAMESPACES } from "../../i18n/i18nConstants";
import { RACE_PLAYER_CONNECTION_STATES } from "./racePlayerRuntimeSessionConfig";

/*
 * Degraded-connection chip (OFFLINE/RECONNECTING only) — a healthy
 * connection renders nothing.
 */

const NOTICE_CONTENT = Object.freeze({
  [RACE_PLAYER_CONNECTION_STATES.OFFLINE]: {
    Icon: WifiOffIcon,
    titleKey: "connection.offlineTitle",
    bodyKey: "connection.offlineBody",
  },
  [RACE_PLAYER_CONNECTION_STATES.RECONNECTING]: {
    Icon: RefreshCwIcon,
    titleKey: "connection.reconnectingTitle",
    bodyKey: "connection.reconnectingBody",
  },
});

export default function RacePlayerConnectionNotice({ connectionState }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const content = NOTICE_CONTENT[connectionState];

  if (!content) {
    return null;
  }

  const { Icon } = content;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none mx-auto flex w-fit max-w-full flex-col items-center gap-0.5 rounded-2xl bg-[var(--qw-surface)] px-4 py-2 text-center shadow-[var(--qw-shadow-sm)]"
    >
      <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--qw-text)]">
        <Icon size={16} style={{ color: "var(--qw-warning)" }} aria-hidden="true" />
        {t(content.titleKey)}
      </span>
      <span className="text-xs text-[var(--qw-text-muted)]">
        {t(content.bodyKey)}
      </span>
    </div>
  );
}
