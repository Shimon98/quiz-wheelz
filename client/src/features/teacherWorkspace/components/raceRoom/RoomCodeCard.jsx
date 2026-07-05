import { useTranslation } from "react-i18next";
import {
  ActionIcon,
  Box,
  Button,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import QRCode from "react-qr-code";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";
import { buildStudentJoinUrl } from "../../../../shared/routes/buildStudentJoinUrl";

/**
 * RoomCodeCard — the room code, big enough to project on a classroom board,
 * with copy + join link + QR. The QR simply encodes the join URL
 * (/join/:roomCode) — scanning it opens the join page with the code
 * prefilled; it never creates a player by itself.
 */
export default function RoomCodeCard({ roomCode }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const joinUrl = roomCode ? buildStudentJoinUrl(roomCode) : null;

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

        {joinUrl && (
          <>
            <CopyButton value={joinUrl} timeout={1500}>
              {({ copied, copy }) => (
                <Button
                  variant="light"
                  size="sm"
                  radius="xl"
                  color={copied ? UI_TONES.SUCCESS : undefined}
                  leftSection={
                    copied ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <LinkIcon size={16} aria-hidden="true" />
                    )
                  }
                  onClick={copy}
                >
                  {copied
                    ? t("raceRoom.joinLinkCopied")
                    : t("raceRoom.copyJoinLink")}
                </Button>
              )}
            </CopyButton>

            {/* QR needs dark-on-light contrast to scan — the white box is
                intentional in both color schemes. */}
            <Stack gap={4} align="center">
              <Box
                p={8}
                bg="white"
                style={{ borderRadius: "var(--mantine-radius-md)" }}
              >
                <QRCode value={joinUrl} size={104} />
              </Box>
              <Text size="xs" c="dimmed">
                {t("raceRoom.qrNote")}
              </Text>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
