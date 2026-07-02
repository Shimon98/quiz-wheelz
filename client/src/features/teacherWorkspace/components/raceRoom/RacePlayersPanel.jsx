import { useTranslation } from "react-i18next";
import {
  Avatar,
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { getRacePlayerStatusConfig } from "../../config/raceStatusConfig";

/*
 * RacePlayersPanel — the joined RacePlayers as visual slots up to
 * maxPlayers (kid-friendly, no heavy table). Server domain terms on purpose:
 * these are RacePlayers inside a race, not "students". The slot layout is
 * ready to swap the avatar for vehicleAssetKey art when vehicles ship.
 */

function RacePlayerSlot({ player }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const statusConfig = getRacePlayerStatusConfig(player.status);

  return (
    <Paper radius="lg" p="md" withBorder>
      <Group gap="sm" wrap="nowrap">
        <Avatar name={player.displayName ?? "?"} color="initials" radius="xl" />
        <Stack gap={2} miw={0} style={{ flex: 1 }}>
          <Text fw={700} truncate>
            {player.displayName}
          </Text>
          {player.laneNumber != null && (
            <Text size="xs" c="dimmed">
              {t("raceRoom.lane", { lane: player.laneNumber })}
            </Text>
          )}
        </Stack>
        <Badge variant="light" color={statusConfig.tone} size="sm" radius="md">
          {t(statusConfig.labelKey)}
        </Badge>
      </Group>
    </Paper>
  );
}

function EmptySlot() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <Paper
      radius="lg"
      p="md"
      withBorder
      style={{ borderStyle: "dashed", opacity: 0.65 }}
    >
      <Text size="sm" c="dimmed" ta="center">
        {t("raceRoom.emptySlot")}
      </Text>
    </Paper>
  );
}

export default function RacePlayersPanel({ players, maxPlayers }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  const joinedPlayers = Array.isArray(players) ? players : [];
  const slotCount = Math.max(maxPlayers ?? 0, joinedPlayers.length);
  const emptySlots = Math.max(slotCount - joinedPlayers.length, 0);

  return (
    <Paper radius="xl" p={{ base: "md", sm: "lg" }} withBorder>
      <Stack gap="md">
        <Title order={3}>{t("raceRoom.playersTitle")}</Title>

        {joinedPlayers.length === 0 && (
          <Stack gap={2} ta="center" py="sm">
            <Text fw={700}>{t("raceRoom.noPlayersTitle")}</Text>
            <Text size="sm" c="dimmed">
              {t("raceRoom.noPlayersBody")}
            </Text>
          </Stack>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {joinedPlayers.map((player) => (
            <RacePlayerSlot
              key={player.racePlayerId ?? player.displayName}
              player={player}
            />
          ))}
          {Array.from({ length: emptySlots }, (_, index) => (
            <EmptySlot key={`empty-${index}`} />
          ))}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
