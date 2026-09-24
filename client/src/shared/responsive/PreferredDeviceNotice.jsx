import { useId } from "react";
import { Affix, Button, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";

import { UI_TONES } from "../../app/theme/quizWheelzTheme";

const NOTICE_POSITION = Object.freeze({
  top: "calc(var(--app-shell-header-offset, 0rem) + var(--mantine-spacing-md))",
  left: "md",
  right: "md",
});
const NOTICE_MAX_WIDTH = "26rem";

export default function PreferredDeviceNotice({
  open,
  title,
  body,
  confirmLabel,
  icon: Icon,
  onDismiss,
}) {
  const titleId = useId();
  const bodyId = useId();

  if (!open) {
    return null;
  }

  return (
    <Affix position={NOTICE_POSITION} maw={NOTICE_MAX_WIDTH} mx="auto">
      <Paper
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        withBorder
        shadow="lg"
        radius="lg"
        p="md"
      >
        <Stack gap="sm">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            {Icon ? (
              <ThemeIcon variant="light" color={UI_TONES.INFO} size={44} radius="xl">
                <Icon size={24} aria-hidden="true" />
              </ThemeIcon>
            ) : null}
            <Stack gap={4}>
              <Text id={titleId} fw={700}>
                {title}
              </Text>
              <Text id={bodyId} size="sm" c="dimmed">
                {body}
              </Text>
            </Stack>
          </Group>
          <Button radius="xl" onClick={onDismiss}>
            {confirmLabel}
          </Button>
        </Stack>
      </Paper>
    </Affix>
  );
}
