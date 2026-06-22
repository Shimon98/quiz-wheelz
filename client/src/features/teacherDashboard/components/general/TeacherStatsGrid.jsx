import TeacherStatCard from "./TeacherStatCard.jsx";
import { useLocaleContent } from "../../../../constants/localeConstants.js";
import { TEACHER_DASHBOARD_STATS_CONTENT } from "../../content/teacherDashboardContent.js";
import { getTeacherDashboardIcon } from "../../constants/teacherDashboardAssets.js";

export default function TeacherStatsGrid({ stats }) {
    const labels = useLocaleContent(TEACHER_DASHBOARD_STATS_CONTENT);

    return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
