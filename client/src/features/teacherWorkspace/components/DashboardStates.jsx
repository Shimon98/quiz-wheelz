import { useTranslation } from "react-i18next";
import { Paper, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RetryableErrorAlert from "../../../shared/components/feedback/RetryableErrorAlert";
import DashboardPrimaryAction from "./DashboardPrimaryAction";

/*
 * The three non-happy dashboard states, together — they share the namespace
 * and are always used by the same page. Split into files only if one of them
 * grows real behavior.
 */

export function DashboardLoadingState() {
  return (
    <Stack gap="xl" aria-busy="true">
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing={{ base: "sm", lg: "md" }}>
        <Skeleton height={104} radius="xl" />
        <Skeleton height={104} radius="xl" />
        <Skeleton height={104} radius="xl" />
        <Skeleton height={104} radius="xl" />
      </SimpleGrid>
      <Skeleton height={280} radius="xl" />
    </Stack>
  );
}

export function DashboardErrorState({ onRetry }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <RetryableErrorAlert
      title={t("states.errorTitle")}
      message={t("states.errorBody")}
      retryLabel={t("states.retry")}
      onRetry={onRetry}
    />
  );
}

export function DashboardEmptyState({ onCreateRace }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <Paper radius="xl" p="xl" withBorder>
      <Stack gap="sm" align="center" ta="center">
        <Title order={3}>{t("states.emptyTitle")}</Title>
        <Text c="dimmed">{t("states.emptyBody")}</Text>
        <DashboardPrimaryAction onClick={onCreateRace} />
      </Stack>
    </Paper>
  );
}
