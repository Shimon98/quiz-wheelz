import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";
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

export default function RacePlayerConnectionNotice({
  connectionState,
  error = null,
  onRetry = null,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const content = NOTICE_CONTENT[connectionState];

  if (!content) {
    return null;
  }

  const { Icon } = content;

  return (
    // pointer-events-auto: the retry button must stay clickable inside the
    // overlay's pointer-events-none wrapper.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto mx-auto flex w-fit max-w-full flex-col items-center gap-0.5 rounded-2xl bg-[var(--qw-surface)] px-4 py-2 text-center shadow-[var(--qw-shadow-sm)]"
    >
      <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--qw-text)]">
        <Icon size={16} style={{ color: "var(--qw-warning)" }} aria-hidden="true" />
        {t(content.titleKey)}
      </span>
      <span className="text-xs text-[var(--qw-text-muted)]">
        {t(content.bodyKey)}
      </span>
      {error && onRetry ? (
        <Button size="compact-sm" variant="light" mt={4} onClick={onRetry}>
          {t("status.retry")}
        </Button>
      ) : null}
    </div>
  );
}
