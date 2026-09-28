import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import StatCard from "../../../shared/components/stats/StatCard";
import { TEACHER_RESULTS_SUMMARY_STATS } from "../config/teacherRaceResultsConfig";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";

export default function TeacherResultsSummary({ summary }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);

  return (
    <div className={S.summary}>
      {TEACHER_RESULTS_SUMMARY_STATS.map((stat) => (
        <StatCard
          key={stat.id}
          compact
          icon={stat.icon}
          tone={stat.tone}
          label={t(stat.labelKey)}
          value={summary[stat.id] ?? t("summary.unavailable")}
          valueDir={stat.valueDir}
        />
      ))}
    </div>
  );
}
