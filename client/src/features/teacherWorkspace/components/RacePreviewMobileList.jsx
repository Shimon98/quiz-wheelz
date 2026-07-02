import { useTranslation } from "react-i18next";
import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { UsersRound } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RaceStatusBadge from "./RaceStatusBadge";

/**
 * RacePreviewMobileList — mobile rendering of the race preview list: cards,
 * not a squeezed table. Same view models as RacePreviewTable.
 */
export default function RacePreviewMobileList({ items, onOpenRace }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <Stack gap="sm">
      {items.map((item) => (
        <Paper key={item.id} withBorder radius="lg" p="md">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Text fw={700} lineClamp={1}>
                {item.title}
              </Text>
              <RaceStatusBadge status={item.status} size="sm" />
            </Group>

            <Group gap="md" c="dimmed" fz="sm">
              {item.subjectName && <Text span>{item.subjectName}</Text>}
              <Group gap={4} wrap="nowrap">
                <UsersRound size={16} aria-hidden="true" />
                <Text span>{item.playersLabel}</Text>
              </Group>
              {item.roomCode && (
                <Badge variant="default" radius="md" size="sm">
                  {item.roomCode}
                </Badge>
              )}
            </Group>

            <Button
              variant="light"
              fullWidth
              onClick={() => onOpenRace(item.race)}
            >
              {t("races.open")}
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
