import { useNavigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import TeacherDashboardHeader from "../components/teacher/TeacherDashboardHeader";
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
            <main className="min-h-screen bg-sky-100 px-4 py-10">
                <section className="mx-auto flex max-w-5xl flex-col gap-6">
                    <TeacherDashboardHeader
                        teacherName={user?.displayName}
                        isLoggingOut={isLoading}
                        onLogout={handleLogout}
                    />

                    <TeacherStatsGrid stats={TEACHER_DASHBOARD_STATS} />

                    <TeacherRaceListPreview />
                </section>
            </main>
        </AppShell>
    );
}