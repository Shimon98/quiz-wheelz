import TeacherRacesPanel from "../races/TeacherRacesPanel.jsx";
import { TEACHER_DASHBOARD_PANEL_STYLES } from "../../styles/dashboardUiStyles";

export default function TeacherDashboardPanels({
                                                   races,
                                                   isRacesLoading,
                                                   racesError,
                                                   onCreateRaceClick,
                                                   onOpenRace,
                                                   onShowAllRacesClick,
                                               }) {
    return (
        <div className={TEACHER_DASHBOARD_PANEL_STYLES.wrapper}>
            <TeacherRacesPanel
                races={races}
                isLoading={isRacesLoading}
                error={racesError}
                onCreateRaceClick={onCreateRaceClick}
                onOpenRace={onOpenRace}
                onShowAllRacesClick={onShowAllRacesClick}
            />
        </div>
    );
}