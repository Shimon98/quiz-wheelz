import TeacherHeroBanner from "./TeacherHeroBanner.jsx";
import TeacherStatsGrid from "./TeacherStatsGrid.jsx";
import TeacherDashboardPanels from "./TeacherDashboardPanels.jsx";
import { TEACHER_DASHBOARD_MAIN_STYLES } from "../../styles/dashboardUiStyles";

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
                                                 onShowAllRacesClick,
                                             }) {
    return (
        <div className={TEACHER_DASHBOARD_MAIN_STYLES.wrapper}>
            <TeacherHeroBanner
                teacherName={teacherName}
                isLoggingOut={isLoggingOut}
                onLogout={onLogout}
            />

            <TeacherStatsGrid stats={stats} />

            <TeacherDashboardPanels
                races={races}
                isRacesLoading={isRacesLoading}
                racesError={racesError}
                onCreateRaceClick={onCreateRaceClick}
                onOpenRace={onOpenRace}
                onShowAllRacesClick={onShowAllRacesClick}
            />
        </div>
    );
}