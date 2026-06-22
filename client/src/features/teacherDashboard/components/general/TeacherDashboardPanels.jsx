import TeacherRacePanel from "./TeacherRacePanel";
import { TEACHER_DASHBOARD_PANEL_STYLES } from "../../styles/dashboardUiStyles";

export default function TeacherDashboardPanels({
                                                   races,
                                                   isRacesLoading,
                                                   racesError,
                                                   onCreateRaceClick,
                                                   onOpenRace,
                                               }) {
    return (
        <div className={TEACHER_DASHBOARD_PANEL_STYLES.wrapper}>
            <TeacherRacePanel
                className="h-full"
                races={races}
                isLoading={isRacesLoading}
                error={racesError}
                onCreateRaceClick={onCreateRaceClick}
                onOpenRace={onOpenRace}
            />
        </div>
    );
}