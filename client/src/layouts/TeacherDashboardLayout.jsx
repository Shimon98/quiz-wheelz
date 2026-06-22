import TeacherSidebar from "../features/teacherDashboard/components/sidebar/TeacherSidebar";
import { getTeacherDashboardAsset } from "../features/teacherDashboard/constants/teacherDashboardAssets";
import { TEACHER_DASHBOARD_LAYOUT_STYLES } from "../features/teacherDashboard/styles/dashboardUiStyles";

export default function TeacherDashboardLayout({
                                                   children,
                                                   onDashboardClick,
                                                   onRacesClick,
                                                   onCreateRaceClick,
                                               }) {
    const generalBackground = getTeacherDashboardAsset("generalBackground");

    return (
        <div className={TEACHER_DASHBOARD_LAYOUT_STYLES.page}>
            {generalBackground && (
                <div
                    aria-hidden="true"
                    className={TEACHER_DASHBOARD_LAYOUT_STYLES.background}
                    style={{
                        backgroundImage: `url(${generalBackground})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            )}

            <div className={TEACHER_DASHBOARD_LAYOUT_STYLES.content}>
                <TeacherSidebar
                    onDashboardClick={onDashboardClick}
                    onRacesClick={onRacesClick}
                    onCreateRaceClick={onCreateRaceClick}
                />

                <main className={TEACHER_DASHBOARD_LAYOUT_STYLES.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}