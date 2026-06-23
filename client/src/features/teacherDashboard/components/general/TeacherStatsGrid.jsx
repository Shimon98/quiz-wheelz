import TeacherStatCard from "./TeacherStatCard.jsx";
import { useLocaleContent } from "../../../../constants/localeConstants.js";
import { TEACHER_DASHBOARD_STATS_CONTENT } from "../../content/teacherDashboardContent.js";
import { getTeacherDashboardLucideIcon } from "../../constants/teacherDashboardIcons.js";

const TEACHER_STATS_GRID_STYLES = Object.freeze({
    wrapper:
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
});

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
                />
            ))}
        </section>
    );
}