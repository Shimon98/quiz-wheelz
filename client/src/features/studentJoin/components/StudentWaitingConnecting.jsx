import { useTranslation } from "react-i18next";
import { Loader, Stack } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RetryableErrorAlert from "../../../shared/components/feedback/RetryableErrorAlert";
import RacePlayerConnectionNotice from "../../../shared/racePlayer/RacePlayerConnectionNotice";

/*
 * Pre-resolution waiting surface (C1-05) — shown until the first reconnect
 * resolves.
 */
export default function StudentWaitingConnecting({
  connectionState,
  error,
  onReconnect,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_JOIN);

  if (error) {
    return (
      <RetryableErrorAlert
        title={t("waiting.loadErrorTitle")}
        message={t(
          `${I18N_NAMESPACES.ERRORS}:${error.messageKey ?? "general.unexpected"}`,
        )}
        retryLabel={t("waiting.retry")}
        onRetry={onReconnect}
      />
    );
  }

  return (
    <Stack align="center" gap="md" py="xl" aria-busy="true">
      <Loader size="lg" />
      <RacePlayerConnectionNotice connectionState={connectionState} />
    </Stack>
  );
}
