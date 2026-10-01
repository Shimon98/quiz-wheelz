import { useTranslation } from "react-i18next";
import { Paper, ThemeIcon, Title } from "@mantine/core";
import { Flag } from "lucide-react";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";
import { STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";

export default function StudentResultsFinalSummary({ counts, playerCount }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const allCompleted = counts.finished >= playerCount;

  return (
    <Paper withBorder radius="xl" p="md">
      <div className={S.summary}>
        <ThemeIcon size="xl" radius="xl" variant="light" color={UI_TONES.SUCCESS} aria-hidden="true">
          <Flag size={22} />
        </ThemeIcon>
        <Title order={2} size="h4">
          {allCompleted
            ? t("results.finalAllCompleted")
            : t("results.finalCompleted", { finished: counts.finished, count: playerCount })}
        </Title>
      </div>
    </Paper>
  );
}
