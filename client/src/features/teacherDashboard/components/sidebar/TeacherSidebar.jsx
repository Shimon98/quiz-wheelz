import { TEACHER_SIDEBAR_STYLES } from "../../styles/dashboardUiStyles";
import TeacherSidebarPanel from "./TeacherSidebarPanel";

export default function TeacherSidebar({
    onDashboardClick,
    onRacesClick,
    onCreateRaceClick,
    teacherName,
    onLogout,
    isLoggingOut = false,
}) {
    return (
        <aside className={TEACHER_SIDEBAR_STYLES.aside}>
            <TeacherSidebarPanel
                onDashboardClick={onDashboardClick}
                onRacesClick={onRacesClick}
                onCreateRaceClick={onCreateRaceClick}
                teacherName={teacherName}
                onLogout={onLogout}
                isLoggingOut={isLoggingOut}
            />
        </aside>
    );
}
