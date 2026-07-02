import { useTranslation } from "react-i18next";
import { Group, Stack, Text, Title } from "@mantine/core";
import { UsersRound } from "lucide-react";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import RaceStatusBadge from "../RaceStatusBadge";
import RaceSubjectLabel from "../RaceSubjectLabel";

/**
 * RaceRoomHeader — race identity at the top of the room: title, status,
 * subject and player count. Reuses the SAME badge/subject components as the
 * dashboard and races lists.
 */
export default function RaceRoomHeader({ item }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <Stack gap={6}>
      <Group gap="sm" align="center" wrap="wrap">
        <Title order={1} fz={{ base: 26, sm: 32 }}>
          {item.title}
        </Title>
        <RaceStatusBadge status={item.status} />
      </Group>

      <Group gap="lg" c="dimmed" wrap="wrap">
        <RaceSubjectLabel
          subjectKey={item.subjectKey}
          label={item.subjectName}
        />
        <Group gap={6} wrap="nowrap">
          <UsersRound size={18} aria-hidden="true" />
          <Text span fw={600}>
            {t("raceRoom.playersCount", { players: item.playersLabel })}
          </Text>
        </Group>
      </Group>
    </Stack>
  );
}
