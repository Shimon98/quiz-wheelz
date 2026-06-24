import TeacherStatCard from "./TeacherStatCard.jsx";
import { useLocaleContent } from "../../../../constants/localeConstants.js";
import { TEACHER_DASHBOARD_STATS_CONTENT } from "../../content/teacherDashboardContent.js";
import { getTeacherDashboardLucideIcon } from "../../constants/teacherDashboardIcons.js";
import { TEACHER_STATS_GRID_STYLES } from "../../styles/dashboardUiStyles.js";

export default function TeacherStatsGrid({ stats }) {
    const labels = useLocaleContent(TEACHER_DASHBOARD_STATS_CONTENT);

    return (
        <section className={TEACHER_STATS_GRID_STYLES.wrapper}>
            {stats.map((stat) => (
                <TeacherStatCard
                    key={stat.id}
                    Icon={getTeacherDashboardLucideIcon(stat.iconName)}
                    label={labels[stat.contentKey]}
                    value={stat.value}
                    tone={stat.tone}
                />
            ))}
        </section>
    );
}