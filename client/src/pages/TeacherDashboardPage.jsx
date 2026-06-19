import { useNavigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import TeacherDashboardLayout from "../layouts/TeacherDashboardLayout";
import TeacherDashboardMain from "../components/teacher/TeacherDashboardMain";
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
                <TeacherDashboardMain
                    teacherName={user?.displayName}
                    isLoggingOut={isLoading}
                    onLogout={handleLogout}
                    stats={TEACHER_DASHBOARD_STATS}
                />
            </TeacherDashboardLayout>
        </AppShell>
    );
}