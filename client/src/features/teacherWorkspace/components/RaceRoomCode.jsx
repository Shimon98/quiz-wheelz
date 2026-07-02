import { useTranslation } from "react-i18next";
import {
  ActionIcon,
  CopyButton,
  Group,
  Paper,
  Text,
  Tooltip,
} from "@mantine/core";
import { Check, Copy } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";

/**
 * RaceRoomCode — the room code as a copyable pill (bold LTR code + copy
 * button), matching the room-code reference image. Clicks stop propagating so
 * copying never triggers the row's "open race" action.
 */
export default function RaceRoomCode({ code }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  if (!code) {
    return (
      <Text span c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Paper
      component="span"
      withBorder
      radius="md"
      px="sm"
      py={4}
      display="inline-block"
      onClick={(event) => event.stopPropagation()}
    >
      <Group gap={6} wrap="nowrap">
        <Text span fw={800} fz="md" dir="ltr" style={{ letterSpacing: "0.06em" }}>
          {code}
        </Text>
        <CopyButton value={String(code)} timeout={1500}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? t("races.copied") : t("races.copyRoomCode")}
              withArrow
            >
              <ActionIcon
                variant="subtle"
                size="sm"
                color={copied ? UI_TONES.SUCCESS : UI_TONES.NEUTRAL}
                aria-label={t("races.copyRoomCode")}
                onClick={copy}
              >
                {copied ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Paper>
  );
}
