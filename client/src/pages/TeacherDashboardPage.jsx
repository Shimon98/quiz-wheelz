import { useNavigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import TeacherDashboardLayout from "../layouts/TeacherDashboardLayout";
import TeacherHeroBanner from "../components/teacher/TeacherHeroBanner";
import TeacherStatsGrid from "../components/teacher/TeacherStatsGrid";
import TeacherRaceListPreview from "../components/teacher/TeacherRaceListPreview";
import { ROUTES } from "../constants/routeConstants";
import { TEACHER_DASHBOARD_STATS } from "../constants/teacherDashboardConstants";
import { useAuthStore } from "../stores/authStore";

export default function TeacherDashboardPage() {
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isLoading = useAuthStore((state) => state.isLoading);

    async function handleLogout() {
        await logout();
        navigate(ROUTES.LOGIN, { replace: true });
    }

    return (
        <AppShell>
            <TeacherDashboardLayout>
                <TeacherHeroBanner
                    teacherName={user?.displayName}
                    isLoggingOut={isLoading}
                    onLogout={handleLogout}
                />

                <TeacherStatsGrid stats={TEACHER_DASHBOARD_STATS} />

                <TeacherRaceListPreview />
            </TeacherDashboardLayout>
        </AppShell>
    );
}