import { useTranslation } from "react-i18next";
import { SimpleGrid } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import StatCard from "../../../shared/components/stats/StatCard";
import { DASHBOARD_STAT_CARDS } from "../config/dashboardStatsConfig";

export default function DashboardStatsGrid({ stats, isLoading = false }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <SimpleGrid cols={{ base: 2, lg: 4 }} spacing={{ base: "sm", lg: "md" }}>
      {DASHBOARD_STAT_CARDS.map((card) => (
        <StatCard
          key={card.id}
          label={t(card.labelKey)}
          value={stats?.[card.id]}
          tone={card.tone}
          icon={card.icon}
          isLoading={isLoading}
        />
      ))}
    </SimpleGrid>
  );
}
