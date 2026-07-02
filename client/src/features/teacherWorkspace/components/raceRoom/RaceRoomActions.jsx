import { useTranslation } from "react-i18next";
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Ban, Play, RefreshCw, Undo2 } from "lucide-react";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";
import { RACE_STATUSES } from "../../config/raceStatusConfig";

const STARTABLE_STATUSES = [
  RACE_STATUSES.WAITING_FOR_PLAYERS,
  RACE_STATUSES.READY,
];

/**
 * RaceRoomActions — the room's action panel. Start is the primary action
 * and is server-owned: the button only asks; disabled states mirror what
 * the server would reject anyway (no players / wrong status / in flight).
 * Cancel is visible-but-disabled scaffolding — no endpoint, no fake logic.
 */
export default function RaceRoomActions({
  status,
  currentPlayers,
  onStartRace,
  isStarting,
  onBackToRaces,
  onRefresh,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  const hasPlayers = (currentPlayers ?? 0) > 0;
  const isStartableStatus = STARTABLE_STATUSES.includes(status);
  const canStart = hasPlayers && isStartableStatus;

  return (
    <Paper radius="xl" p="lg" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fw={700}>{t("raceRoom.actionsTitle")}</Text>
          <Tooltip label={t("raceRoom.refresh")} withArrow>
            <ActionIcon
              variant="subtle"
              color={UI_TONES.NEUTRAL}
              aria-label={t("raceRoom.refresh")}
              onClick={onRefresh}
            >
              <RefreshCw size={18} aria-hidden="true" />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Button
          size="lg"
          radius="xl"
          leftSection={<Play size={20} aria-hidden="true" />}
          disabled={!canStart}
          loading={isStarting}
          onClick={onStartRace}
        >
          {t("raceRoom.startRace")}
        </Button>

        {isStartableStatus && !hasPlayers && (
          <Text size="xs" c="dimmed" ta="center">
            {t("raceRoom.needPlayers")}
          </Text>
        )}

        {/* Future scaffolding: visible so the layout is ready, disabled so
            nothing pretends to work — no endpoint call, no local mutation. */}
        <Tooltip label={t("raceRoom.cancelSoon")} withArrow>
          <Button
            variant="light"
            color={UI_TONES.DANGER}
            radius="xl"
            leftSection={<Ban size={18} aria-hidden="true" />}
            disabled
            style={{ pointerEvents: "auto" }}
          >
            {t("raceRoom.cancelRace")}
          </Button>
        </Tooltip>

        <Button
          variant="default"
          radius="xl"
          leftSection={<Undo2 size={18} aria-hidden="true" />}
          onClick={onBackToRaces}
        >
          {t("raceRoom.backToRaces")}
        </Button>
      </Stack>
    </Paper>
  );
}
