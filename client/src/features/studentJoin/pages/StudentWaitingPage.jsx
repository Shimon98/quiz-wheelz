import { useState } from "react";
import { Navigate } from "react-router-dom";
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
import { ROUTES } from "../../../constants/routeConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { STUDENT_JOIN_STORAGE_KEY } from "../config/studentJoinConfig";
import StudentWaitingStatCard from "../components/StudentWaitingStatCard";

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
 * (kept in sessionStorage so a refresh survives). The server race-state
 * endpoint (API_ENDPOINTS.RACE_PLAYERS.RACE_STATE) is live and owns the
 * waiting/racing/finished truth; wiring the live transition into the game
 * happens with the real student race route (C1-01), so this page still shows
 * no live counters and does no polling.
 */
export default function StudentWaitingPage() {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_JOIN);
  const [joinData] = useState(readStoredJoin);

  if (!joinData) {
    return <Navigate to={ROUTES.STUDENT_JOIN} replace />;
  }

  const playerName = joinData.player?.displayName ?? "";
  const laneNumber = joinData.player?.laneNumber;

  // Small stat cubes — only the facts the join response actually has.
  const statCards = [];
  if (laneNumber != null) {
    statCards.push({
      key: "lane",
      label: t("waiting.laneLabel"),
      value: laneNumber,
    });
  }
  if (joinData.currentPlayers != null && joinData.maxPlayers != null) {
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
        <Title order={1} fz={{ base: 26, sm: 30 }} fw={700} ff="var(--font-sans)">
          {t("waiting.hello", { name: playerName })}
        </Title>
        <Text c="dimmed" fw={600}>
          {joinData.raceTitle}
        </Text>
      </Stack>

      <Stack gap="xs" w="100%">
        <StudentWaitingStatCard
          label={t("waiting.roomCodeLabel")}
          value={joinData.roomCode}
          valueDir="ltr"
        />
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
