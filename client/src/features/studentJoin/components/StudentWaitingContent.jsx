import { useTranslation } from "react-i18next";
import {
  Badge,
  Divider,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import RetryableErrorAlert from "../../../shared/components/feedback/RetryableErrorAlert";
import StudentWaitingStatCard from "./StudentWaitingStatCard";

/*
 * The waiting card presentation. joinData is an optional display cache —
 * server race-state values win; missing cache just hides those facts.
 */
export default function StudentWaitingContent({
  joinData,
  raceState,
  view,
  isLoading,
  error,
  retry,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_JOIN);

  if (!raceState && isLoading) {
    return (
      <Stack align="center" py="xl" aria-busy="true">
        <Loader size="lg" />
      </Stack>
    );
  }

  if ((!raceState && error) || view === RACE_VIEWS.UNKNOWN) {
    return (
      <RetryableErrorAlert
        title={t("waiting.loadErrorTitle")}
        message={t(
          `${I18N_NAMESPACES.ERRORS}:${error?.messageKey ?? "general.unexpected"}`,
        )}
        retryLabel={t("waiting.retry")}
        onRetry={retry}
      />
    );
  }

  const playerName = joinData?.player?.displayName ?? "";
  const laneNumber = joinData?.player?.laneNumber;
  const raceTitle = raceState?.raceTitle ?? joinData?.raceTitle ?? "";
  const roomCode = raceState?.roomCode ?? joinData?.roomCode ?? "";

  const statCards = [];
  if (laneNumber != null) {
    statCards.push({
      key: "lane",
      label: t("waiting.laneLabel"),
      value: laneNumber,
    });
  }
  if (joinData?.currentPlayers != null && joinData?.maxPlayers != null) {
    statCards.push({
      key: "players",
      label: t("waiting.playersLabel"),
      value: `${joinData.currentPlayers}/${joinData.maxPlayers}`,
      valueDir: "ltr",
    });
  }

  return (
    <Stack gap="md" ta="center" align="center">
      <Badge variant="light" color={UI_TONES.SUCCESS} size="lg" radius="xl">
        {t("waiting.joined")}
      </Badge>

      <Stack gap={2}>
        {/* Same brand-font treatment as the join title (see there). */}
        {playerName ? (
          <Title order={1} fz={{ base: 26, sm: 30 }} fw={700} ff="var(--font-sans)">
            {t("waiting.hello", { name: playerName })}
          </Title>
        ) : null}
        {raceTitle ? (
          <Text c="dimmed" fw={600}>
            {raceTitle}
          </Text>
        ) : null}
      </Stack>

      <Stack gap="xs" w="100%">
        {roomCode ? (
          <StudentWaitingStatCard
            label={t("waiting.roomCodeLabel")}
            value={roomCode}
            valueDir="ltr"
          />
        ) : null}
        {statCards.length > 0 && (
          <SimpleGrid cols={statCards.length} spacing="xs" w="100%">
            {statCards.map((card) => (
              <StudentWaitingStatCard
                key={card.key}
                label={card.label}
                value={card.value}
                valueDir={card.valueDir}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <Divider w="100%" />

      <Stack gap={6} align="center">
        <Loader type="dots" size="lg" />
        <Text fw={700}>{t("waiting.waitingForTeacher")}</Text>
        <Text size="sm" c="dimmed">
          {t("waiting.keepOpen")}
        </Text>
      </Stack>
    </Stack>
  );
}
