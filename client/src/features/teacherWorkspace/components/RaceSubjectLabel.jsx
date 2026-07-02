import { Group, Text, ThemeIcon } from "@mantine/core";
import { BookOpen, Calculator } from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";

// Subject → icon. Only math exists today; new subjects add a line here.
const SUBJECT_ICONS = {
  MATH: Calculator,
  MATHEMATICS: Calculator,
};

const DEFAULT_SUBJECT_ICON = BookOpen;

/**
 * RaceSubjectLabel — subject name with its icon (calculator for math),
 * slightly larger than plain cell text, per the reference image.
 */
export default function RaceSubjectLabel({ subjectKey, label }) {
  if (!label) {
    return (
      <Text span c="dimmed">
        —
      </Text>
    );
  }

  const SubjectIcon = SUBJECT_ICONS[subjectKey] ?? DEFAULT_SUBJECT_ICON;

  return (
    <Group gap={6} wrap="nowrap">
      <ThemeIcon variant="transparent" color={UI_TONES.NEUTRAL} size="sm">
        <SubjectIcon size={18} aria-hidden="true" />
      </ThemeIcon>
      <Text span fw={600} fz="md">
        {label}
      </Text>
    </Group>
  );
}
