import { useTranslation } from "react-i18next";
import { Button, Loader, Stack, Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RetryableErrorAlert from "../../../shared/components/feedback/RetryableErrorAlert";
import { TEACHER_LIVE_VIEWS } from "../utils/resolveTeacherLiveView";

const ALERT_CONTENT = Object.freeze({
  [TEACHER_LIVE_VIEWS.ERROR]: {
    titleKey: "states.errorTitle",
  },
  [TEACHER_LIVE_VIEWS.CONTRACT_ERROR]: {
    titleKey: "states.contractTitle",
    bodyKey: "states.contractBody",
  },
});

const MESSAGE_CONTENT = Object.freeze({
  [TEACHER_LIVE_VIEWS.LOADING]: {
    titleKey: "states.loading",
    withLoader: true,
  },
  [TEACHER_LIVE_VIEWS.NOT_FOUND]: {
    titleKey: "states.notFoundTitle",
    bodyKey: "states.notFoundBody",
    withBack: true,
  },
  [TEACHER_LIVE_VIEWS.CANCELLED]: {
    titleKey: "states.cancelledTitle",
    bodyKey: "states.cancelledBody",
    withBack: true,
  },
});

function resolveAlertMessage(t, content, error) {
  if (content.bodyKey) {
    return t(content.bodyKey);
  }

  return error?.messageKey
    ? t(`${I18N_NAMESPACES.ERRORS}:${error.messageKey}`)
    : undefined;
}

export default function TeacherRaceLiveStates({
  view,
  error = null,
  onRetry,
  onBackToRaces,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const alertContent = ALERT_CONTENT[view];

  if (alertContent) {
    return (
      <RetryableErrorAlert
        title={t(alertContent.titleKey)}
        message={resolveAlertMessage(t, alertContent, error)}
        retryLabel={t("states.retry")}
        onRetry={onRetry}
      />
    );
  }

  const content = MESSAGE_CONTENT[view];

  if (!content) {
    return null;
  }

  return (
    <Stack
      gap="md"
      align="center"
      ta="center"
      py="xl"
      aria-busy={content.withLoader || undefined}
    >
      {content.withLoader ? <Loader size="lg" /> : null}
      <Title order={2}>{t(content.titleKey)}</Title>
      {content.bodyKey ? <Text c="dimmed">{t(content.bodyKey)}</Text> : null}
      {content.withBack ? (
        <Button variant="light" onClick={onBackToRaces}>
          {t("states.backToRaces")}
        </Button>
      ) : null}
    </Stack>
  );
}
