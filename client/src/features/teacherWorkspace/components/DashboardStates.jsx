import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { CircleAlert } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
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
    <Alert
      color={UI_TONES.DANGER}
      radius="xl"
      icon={<CircleAlert aria-hidden="true" />}
      title={t("states.errorTitle")}
    >
      <Stack gap="sm" align="flex-start">
        <Text size="sm">{t("states.errorBody")}</Text>
        <Button
          variant="light"
          color={UI_TONES.DANGER}
          size="sm"
          onClick={onRetry}
        >
          {t("states.retry")}
        </Button>
      </Stack>
    </Alert>
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
