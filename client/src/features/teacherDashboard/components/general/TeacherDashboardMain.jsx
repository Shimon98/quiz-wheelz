import TeacherHeroBanner from "./TeacherHeroBanner.jsx";
import TeacherStatsSection from "./TeacherStatsSection.jsx";
import TeacherDashboardPanels from "./TeacherDashboardPanels.jsx";

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
