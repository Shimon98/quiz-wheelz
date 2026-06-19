import TeacherStatCard from "./TeacherStatCard";
import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_STATS_CONTENT } from "../../constants/teacherDashboardContent";

export default function TeacherStatsGrid({ stats }) {
    const labels = useLocaleContent(TEACHER_DASHBOARD_STATS_CONTENT);

    return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <TeacherStatCard
                    key={stat.id}
                    icon={stat.icon}
                    label={labels[stat.contentKey]}
                    value={stat.value}
                />
            ))}
        </section>
    );
}