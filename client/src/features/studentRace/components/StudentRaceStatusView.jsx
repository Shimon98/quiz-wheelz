import { useTranslation } from "react-i18next";
import { Button, Loader, Stack, Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import RetryableErrorAlert from "../../../shared/components/feedback/RetryableErrorAlert";
import {
  STUDENT_RACE_STATUSES,
  STUDENT_RACE_STATUS_CONTENT,
} from "./studentRaceStatusConfig";

/*
 * StudentRaceStatusView — the student race's full-screen presentation for
 * every non-playing state (loading / blocking error / RACE_VIEWS). One small
 * component on purpose: same surface, same namespace, same visual family;
 * split only if a state grows real behavior. The page decides WHICH state,
 * this component decides HOW it looks. It knows nothing about DTOs, axios,
 * Pixi or routing. Vocabulary/content map: studentRaceStatusConfig.js.
 */

/* Full-viewport centered surface — the race route's own ground, deliberately
 * NOT StudentShell (no hero/card entry geometry on the game surface). */
function StatusSurface({ busy = false, children }) {
  return (
    <div
      className="flex min-h-dvh w-full items-center justify-center bg-[var(--qw-bg)] px-6"
      aria-busy={busy || undefined}
    >
      <Stack gap="md" align="center" ta="center" maw={420} w="100%">
        {children}
      </Stack>
    </div>
  );
}

export default function StudentRaceStatusView({
  status,
  error = null,
  onRetry = null,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  if (status === STUDENT_RACE_STATUSES.ERROR) {
    return (
      <StatusSurface>
        <RetryableErrorAlert
          title={t("status.errorTitle")}
          message={
            error?.messageKey
              ? t(`${I18N_NAMESPACES.ERRORS}:${error.messageKey}`)
              : undefined
          }
          retryLabel={t("status.retry")}
          onRetry={onRetry}
        />
      </StatusSurface>
    );
  }

  // An unexpected status prop falls back to the safe UNKNOWN content.
  const content =
    STUDENT_RACE_STATUS_CONTENT[status] ??
    STUDENT_RACE_STATUS_CONTENT[RACE_VIEWS.UNKNOWN];

  return (
    <StatusSurface busy={Boolean(content.withLoader)}>
      {content.withLoader ? <Loader size="lg" /> : null}
      <Title order={2}>{t(content.titleKey)}</Title>
      <Text c="dimmed">{t(content.bodyKey)}</Text>
      {content.withRetry && onRetry ? (
        <Button variant="light" size="md" onClick={onRetry}>
          {t("status.retry")}
        </Button>
      ) : null}
    </StatusSurface>
  );
}
