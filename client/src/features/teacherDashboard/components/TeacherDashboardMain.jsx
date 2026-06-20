import TeacherHeroBanner from "./TeacherHeroBanner";
import TeacherStatsSection from "./TeacherStatsSection";
import TeacherDashboardPanels from "./TeacherDashboardPanels";

export default function TeacherDashboardMain({teacherName, isLoggingOut, onLogout, stats,}) {
    return (
        <>
            <TeacherHeroBanner
                teacherName={teacherName}
                isLoggingOut={isLoggingOut}
                onLogout={onLogout}
            />

            <TeacherStatsSection stats={stats} />

            <TeacherDashboardPanels />
        </>
    );
}