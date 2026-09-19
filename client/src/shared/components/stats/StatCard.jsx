import { Group, Paper, Skeleton, Stack, Text, ThemeIcon } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";

const SIZE_PRESETS = Object.freeze({
  regular: { padding: "lg", skeletonHeight: 104, iconBox: 52, iconGlyph: 26, valueSize: 30 },
  compact: { padding: "sm", skeletonHeight: 72, iconBox: 40, iconGlyph: 20, valueSize: 22 },
});

const ICON_WOBBLE = Object.freeze({
  rotate: [0, -14, 14, -7, 0],
  transition: { duration: 0.5 },
});

export default function StatCard({
  label,
  value,
  tone,
  icon: Icon,
  description,
  valueDir,
  isLoading = false,
  compact = false,
}) {
  const reduce = useReducedMotion();
  const preset = compact ? SIZE_PRESETS.compact : SIZE_PRESETS.regular;

  if (isLoading) {
    return <Skeleton height={preset.skeletonHeight} radius="xl" />;
  }

  return (
    <Paper
      radius="xl"
      p={preset.padding}
      withBorder
      style={{
        borderBottom: `4px solid var(--mantine-color-${tone}-6)`,
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        <motion.div
          style={{ display: "inline-flex" }}
          whileHover={reduce ? undefined : ICON_WOBBLE}
        >
          <ThemeIcon variant="light" color={tone} size={preset.iconBox} radius="xl">
            <Icon size={preset.iconGlyph} aria-hidden="true" />
          </ThemeIcon>
        </motion.div>

        <Stack gap={0} align="flex-end" miw={0}>
          <Text fz={preset.valueSize} fw={800} lh={1.15} dir={valueDir}>
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
