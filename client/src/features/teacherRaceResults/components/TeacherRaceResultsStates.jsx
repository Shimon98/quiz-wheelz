import { useTranslation } from "react-i18next";
import { Button, Group, Loader, Stack, Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RetryableErrorAlert from "../../../shared/components/feedback/RetryableErrorAlert";
import { TEACHER_RESULTS_VIEWS } from "../utils/resolveTeacherResultsView";

const ALERT_CONTENT = Object.freeze({
  [TEACHER_RESULTS_VIEWS.ERROR]: {
    titleKey: "states.errorTitle",
  },
  [TEACHER_RESULTS_VIEWS.CONTRACT_ERROR]: {
    titleKey: "states.contractTitle",
    bodyKey: "states.contractBody",
  },
});

const MESSAGE_CONTENT = Object.freeze({
  [TEACHER_RESULTS_VIEWS.LOADING]: {
    titleKey: "states.loading",
    withLoader: true,
  },
  [TEACHER_RESULTS_VIEWS.NOT_FOUND]: {
    titleKey: "states.notFoundTitle",
    bodyKey: "states.notFoundBody",
    withBack: true,
  },
  [TEACHER_RESULTS_VIEWS.NOT_AVAILABLE]: {
    titleKey: "states.notAvailableTitle",
    bodyKey: "states.notAvailableBody",
    withRetry: true,
    withBack: true,
  },
});

function resolveAlertMessage(t, content, error) {
  if (content.bodyKey) {
    return t(content.bodyKey);
  }

  return error?.messageKey ? t(`${I18N_NAMESPACES.ERRORS}:${error.messageKey}`) : undefined;
}

export default function TeacherRaceResultsStates({ view, error = null, onRetry, onBackToRaces }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);
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
    <Stack gap="md" align="center" ta="center" py="xl" aria-busy={content.withLoader || undefined}>
      {content.withLoader ? <Loader size="lg" /> : null}
      <Title order={2}>{t(content.titleKey)}</Title>
      {content.bodyKey ? <Text c="dimmed">{t(content.bodyKey)}</Text> : null}
      <Group justify="center" gap="sm">
        {content.withRetry ? (
          <Button variant="light" onClick={onRetry}>
            {t("states.retry")}
          </Button>
        ) : null}
        {content.withBack ? (
          <Button variant="subtle" onClick={onBackToRaces}>
            {t("states.backToRaces")}
          </Button>
        ) : null}
      </Group>
    </Stack>
  );
}
