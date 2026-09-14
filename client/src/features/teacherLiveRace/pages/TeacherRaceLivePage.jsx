import { useCallback } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Container,
  Group,
  NumberFormatter,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import {
  ROUTES,
  buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";
import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import useTeacherRaceLive from "../hooks/useTeacherRaceLive";
import {
  resolveTeacherLiveView,
  TEACHER_LIVE_VIEWS,
} from "../utils/resolveTeacherLiveView";
import TeacherRaceLiveStates from "../components/TeacherRaceLiveStates";

const FOUNDATION_STATUS_CONTENT = Object.freeze({
  [RACE_STATUSES.IN_PROGRESS]: {
    labelKey: "foundation.live",
    tone: UI_TONES.SUCCESS,
  },
  [RACE_STATUSES.FINISHED]: {
    labelKey: "foundation.finished",
    tone: UI_TONES.INFO,
  },
});

function FoundationFact({ label, value }) {
  return (
    <Stack gap={0}>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="lg">
        {value}
      </Text>
    </Stack>
  );
}

function FoundationBoard({ runtime }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const statusContent = FOUNDATION_STATUS_CONTENT[runtime.race.status];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <Title order={1} fz={{ base: 26, sm: 32 }}>
          {runtime.race.title}
        </Title>
        <Badge size="lg" variant="filled" color={statusContent.tone}>
          {t(statusContent.labelKey)}
        </Badge>
      </Group>

      <Group gap="xl" wrap="wrap">
        <FoundationFact
          label={t("foundation.roomCode")}
          value={runtime.race.roomCode}
        />
        <FoundationFact
          label={t("foundation.players")}
          value={runtime.players.length}
        />
        <FoundationFact
          label={t("foundation.eventVersion")}
          value={runtime.eventVersion}
        />
      </Group>

      <Paper radius="xl" p={{ base: "md", sm: "lg" }} withBorder>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("foundation.rank")}</Table.Th>
              <Table.Th>{t("foundation.playerName")}</Table.Th>
              <Table.Th>{t("foundation.position")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {runtime.players.map((player) => (
              <Table.Tr key={player.racePlayerId}>
                <Table.Td>{player.rank}</Table.Td>
                <Table.Td>
                  <Text fw={700}>{player.displayName}</Text>
                </Table.Td>
                <Table.Td>
                  <NumberFormatter value={player.position} decimalScale={1} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}

export default function TeacherRaceLivePage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { runtime, isLoading, error, retry } = useTeacherRaceLive(raceId);
  const view = resolveTeacherLiveView({ isLoading, error, runtime });

  const handleBackToRaces = useCallback(() => {
    navigate(ROUTES.TEACHER_RACES);
  }, [navigate]);

  if (view === TEACHER_LIVE_VIEWS.REDIRECT_ROOM) {
    return (
      <Navigate to={buildTeacherRaceRoomPath(runtime.race.raceId)} replace />
    );
  }

  return (
    <Container size="xl">
      {view === TEACHER_LIVE_VIEWS.PROJECTOR ? (
        <FoundationBoard runtime={runtime} />
      ) : (
        <TeacherRaceLiveStates
          view={view}
          error={error}
          onRetry={retry}
          onBackToRaces={handleBackToRaces}
        />
      )}
    </Container>
  );
}
