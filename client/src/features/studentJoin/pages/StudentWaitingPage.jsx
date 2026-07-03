import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Divider, Group, Loader, Stack, Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { ROUTES } from "../../../constants/routeConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { STUDENT_JOIN_STORAGE_KEY } from "../config/studentJoinConfig";

function readStoredJoin() {
  try {
    const raw = sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * StudentWaitingPage — "you're in, hang tight". Renders the join response
 * (kept in sessionStorage so a refresh survives); there is no student
 * room-state endpoint yet, so no live counters and no polling — when the
 * server grows one (or SSE lands), this page picks up live updates and the
 * automatic jump into the game.
 */
export default function StudentWaitingPage() {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_JOIN);
  const [joinData] = useState(readStoredJoin);

  if (!joinData) {
    return <Navigate to={ROUTES.STUDENT_JOIN} replace />;
  }

  const playerName = joinData.player?.displayName ?? "";
  const laneNumber = joinData.player?.laneNumber;

  return (
    <Stack gap="md" ta="center" align="center">
      <Badge variant="light" color={UI_TONES.SUCCESS} size="lg" radius="md">
        {t("waiting.joined")}
      </Badge>

      <Title order={1} fz={26}>
        {t("waiting.hello", { name: playerName })}
      </Title>

      <Stack gap={6} w="100%">
        <Group justify="space-between">
          <Text c="dimmed">{t("waiting.raceLabel")}</Text>
          <Text fw={700}>{joinData.raceTitle}</Text>
        </Group>
        <Group justify="space-between">
          <Text c="dimmed">{t("waiting.roomCodeLabel")}</Text>
          <Text fw={800} dir="ltr" style={{ letterSpacing: "0.08em" }}>
            {joinData.roomCode}
          </Text>
        </Group>
        {laneNumber != null && (
          <Group justify="space-between">
            <Text c="dimmed">{t("waiting.laneLabel")}</Text>
            <Text fw={700}>{laneNumber}</Text>
          </Group>
        )}
        {joinData.currentPlayers != null && joinData.maxPlayers != null && (
          <Group justify="space-between">
            <Text c="dimmed">{t("waiting.playersLabel")}</Text>
            <Text fw={700} dir="ltr">
              {joinData.currentPlayers}/{joinData.maxPlayers}
            </Text>
          </Group>
        )}
      </Stack>

      <Divider w="100%" />

      <Stack gap={6} align="center">
        <Loader type="dots" />
        <Text fw={700}>{t("waiting.waitingForTeacher")}</Text>
        <Text size="sm" c="dimmed">
          {t("waiting.keepOpen")}
        </Text>
      </Stack>
    </Stack>
  );
}
