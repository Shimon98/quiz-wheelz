import { Alert, Button, Stack, Text } from "@mantine/core";
import { CircleAlert } from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";

/*
 * The ONE shared "something failed + try again" presentation — danger Alert,
 * icon, title, friendly message and a Retry action. Presentation-only:
 * callers pass already-translated strings; no i18n, no domain knowledge,
 * no routing here. Teacher dashboard and student race both compose it.
 */
export default function RetryableErrorAlert({
  title,
  message,
  retryLabel,
  onRetry,
}) {
  return (
    <Alert
      color={UI_TONES.DANGER}
      radius="xl"
      icon={<CircleAlert aria-hidden="true" />}
      title={title}
    >
      <Stack gap="sm" align="flex-start">
        {message ? <Text size="sm">{message}</Text> : null}
        {onRetry ? (
          <Button
            variant="light"
            color={UI_TONES.DANGER}
            size="sm"
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}
