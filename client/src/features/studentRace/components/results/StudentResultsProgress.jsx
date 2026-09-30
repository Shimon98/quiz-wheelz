import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Paper, Progress, Stack, Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { STUDENT_RESULTS_SEGMENT_TONES } from "../../config/studentRaceResultsViewConfig";
import { STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";
import { resolveResultsProgressSegments } from "../../utils/studentResultsPresentation";

export default function StudentResultsProgress({ counts }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const titleId = useId();
  const segments = resolveResultsProgressSegments(counts).filter((segment) => segment.count > 0);

  return (
    <Paper component="section" withBorder radius="xl" p="md" aria-labelledby={titleId}>
      <Stack gap="xs">
        <Title order={2} size="h5" id={titleId}>
          <span className={S.progressTitle}>
            <span className={S.progressFlag} aria-hidden="true" />
            {t("results.progressLabel")}
          </span>
        </Title>
        <Text fw={700}>{t("results.progressLive", { finished: counts.finished, racing: counts.racing })}</Text>
        {counts.out > 0 ? (
          <Text size="sm" c="dimmed">
            {t("results.progressOut", { count: counts.out })}
          </Text>
        ) : null}
        <Progress.Root size="lg" radius="xl" aria-hidden="true">
          {segments.map((segment) => (
            <Progress.Section
              key={segment.id}
              value={segment.percent}
              color={STUDENT_RESULTS_SEGMENT_TONES[segment.id]}
              data-segment={segment.id}
              data-count={segment.count}
            />
          ))}
        </Progress.Root>
      </Stack>
    </Paper>
  );
}
