import TeacherHeroBanner from "./TeacherHeroBanner";
import TeacherStatsSection from "./TeacherStatsSection";
import TeacherDashboardPanels from "./TeacherDashboardPanels";

export default function TeacherDashboardMain({
    teacherName,
    isLoggingOut,
    onLogout,
    stats,
    races,
    isRacesLoading,
    racesError,
    onCreateRaceClick,
    onOpenRace,
}) {
    return (
        <>
            <TeacherHeroBanner
                teacherName={teacherName}
                isLoggingOut={isLoggingOut}
                onLogout={onLogout}
            />

            <TeacherStatsSection stats={stats} />

            <TeacherDashboardPanels
                races={races}
                isRacesLoading={isRacesLoading}
                racesError={racesError}
                onCreateRaceClick={onCreateRaceClick}
                onOpenRace={onOpenRace}
            />
        </>
    );
}
