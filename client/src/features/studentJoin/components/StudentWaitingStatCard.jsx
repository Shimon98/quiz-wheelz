import { Paper, Stack, Text } from "@mantine/core";

/**
 * StudentWaitingStatCard — one friendly stat cube on the waiting screen
 * (room code / lane / connected players): a tiny dimmed label over a big
 * bold value. Values like codes and "1/4" counts pass valueDir="ltr" so
 * they read left-to-right inside the RTL shell.
 */
export default function StudentWaitingStatCard({ label, value, valueDir }) {
  return (
    <Paper radius="lg" p="sm" withBorder w="100%" bg="var(--qw-surface-alt)">
      <Stack gap={2} align="center">
        <Text size="xs" c="dimmed" fw={600}>
          {label}
        </Text>
        <Text
          fw={800}
          fz="lg"
          dir={valueDir}
          style={valueDir === "ltr" ? { letterSpacing: "0.08em" } : undefined}
        >
          {value}
        </Text>
      </Stack>
    </Paper>
  );
}
