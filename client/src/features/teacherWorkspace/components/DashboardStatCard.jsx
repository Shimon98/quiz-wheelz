import { Group, Paper, Skeleton, Stack, Text, ThemeIcon } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";

/**
 * DashboardStatCard — one colorful stat tile (icon, value, label) with a
 * colored base strip, matching the stat-cards reference image. `tone` is a
 * Mantine palette name that must come from UI_TONES via config — the card
 * itself never knows color names. The icon does a happy wobble on hover.
 */
export default function DashboardStatCard({
  label,
  value,
  tone,
  icon: Icon,
  description,
  isLoading = false,
}) {
  const reduce = useReducedMotion();

  if (isLoading) {
    return <Skeleton height={104} radius="xl" />;
  }

  return (
    <Paper
      radius="xl"
      p="lg"
      withBorder
      style={{
        borderBottom: `4px solid var(--mantine-color-${tone}-6)`,
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <motion.div
          style={{ display: "inline-flex" }}
          whileHover={
            reduce
              ? undefined
              : { rotate: [0, -14, 14, -7, 0], transition: { duration: 0.5 } }
          }
        >
          <ThemeIcon variant="light" color={tone} size={52} radius="xl">
            <Icon size={26} aria-hidden="true" />
          </ThemeIcon>
        </motion.div>

        <Stack gap={0} align="flex-end">
          <Text fz={30} fw={800} lh={1.15}>
            {value ?? 0}
          </Text>
          <Text size="sm" c="dimmed" fw={600}>
            {label}
          </Text>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
