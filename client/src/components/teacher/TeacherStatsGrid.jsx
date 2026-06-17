import TeacherStatCard from "./TeacherStatCard";

export default function TeacherStatsGrid({ stats }) {
    return (
        <section className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
                <TeacherStatCard
                    key={stat.id}
                    label={stat.label}
                    value={stat.value}
                />
            ))}
        </section>
    );
}