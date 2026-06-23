import TeacherStatCard from "./TeacherStatCard.jsx";
import { useLocaleContent } from "../../../../constants/localeConstants.js";
import { TEACHER_DASHBOARD_STATS_CONTENT } from "../../content/teacherDashboardContent.js";
import { getTeacherDashboardIcon } from "../../constants/teacherDashboardAssets.js";

const TEACHER_STATS_GRID_STYLES = Object.freeze({
    wrapper:
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
});

export default function TeacherStatsGrid({ stats }) {
    const labels = useLocaleContent(TEACHER_DASHBOARD_STATS_CONTENT);

    return (
        <section className={TEACHER_STATS_GRID_STYLES.wrapper}>
            {stats.map((stat) => (
                <TeacherStatCard
                    key={stat.id}
                    icon={getTeacherDashboardIcon(stat.iconKey)}
                    label={labels[stat.contentKey]}
                    value={stat.value}
                />
            ))}
        </section>
    );
}