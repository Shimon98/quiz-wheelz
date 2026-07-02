import { useTranslation } from "react-i18next";
import {
  ActionIcon,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Check, Copy } from "lucide-react";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";

/**
 * RoomCodeCard — the room code, big enough to project on a classroom board,
 * with copy + join instructions. (The small RaceRoomCode pill stays for list
 * rows; this is the projection-size version for the room itself.)
 */
export default function RoomCodeCard({ roomCode }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <Paper radius="xl" p="lg" withBorder>
      <Stack gap="xs" align="center" ta="center">
        <Text size="sm" fw={700} c="dimmed">
          {t("raceRoom.roomCodeTitle")}
        </Text>

        <Group gap="sm" wrap="nowrap" align="center">
          <Text
            span
            dir="ltr"
            fz={{ base: 40, sm: 52 }}
            fw={900}
            style={{ letterSpacing: "0.12em", lineHeight: 1.1 }}
          >
            {roomCode ?? "—"}
          </Text>

          {roomCode && (
            <CopyButton value={String(roomCode)} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? t("races.copied") : t("races.copyRoomCode")}
                  withArrow
                >
                  <ActionIcon
                    variant="light"
                    size="lg"
                    color={copied ? UI_TONES.SUCCESS : UI_TONES.NEUTRAL}
                    aria-label={t("races.copyRoomCode")}
                    onClick={copy}
                  >
                    {copied ? (
                      <Check size={20} aria-hidden="true" />
                    ) : (
                      <Copy size={20} aria-hidden="true" />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          )}
        </Group>

        <Text size="sm" c="dimmed">
          {t("raceRoom.shareCodeNote")}
        </Text>
      </Stack>
    </Paper>
  );
}
