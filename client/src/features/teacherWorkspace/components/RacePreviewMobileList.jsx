import { useTranslation } from "react-i18next";
import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { UsersRound } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RaceStatusBadge from "./RaceStatusBadge";
import RaceRoomCode from "./RaceRoomCode";
import RaceSubjectLabel from "./RaceSubjectLabel";

/**
 * RacePreviewMobileList — mobile rendering of a race list: cards, not a
 * squeezed table. Same view models as RacePreviewTable; `renderRowAction`
 * swaps the default open button for a status-driven action.
 */
export default function RacePreviewMobileList({
  items,
  onOpenRace,
  renderRowAction,
}) {
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

            <Group gap="md" c="dimmed" fz="sm" justify="space-between">
              <Group gap="md" wrap="nowrap">
                {item.subjectName && (
                  <RaceSubjectLabel
                    subjectKey={item.subjectKey}
                    label={item.subjectName}
                  />
                )}
                <Group gap={4} wrap="nowrap">
                  <UsersRound size={16} aria-hidden="true" />
                  <Text span>{item.playersLabel}</Text>
                </Group>
              </Group>
              {item.roomCode && <RaceRoomCode code={item.roomCode} />}
            </Group>

            {renderRowAction ? (
              renderRowAction(item)
            ) : (
              <Button
                variant="light"
                fullWidth
                onClick={() => onOpenRace(item.race)}
              >
                {t("races.open")}
              </Button>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
