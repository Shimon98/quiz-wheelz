import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../../../layouts/AppShell";
import TeacherDashboardLayout from "../../../layouts/TeacherDashboardLayout";
import TeacherDashboardMain from "../components/general/TeacherDashboardMain.jsx";

import { ROUTES } from "../../../constants/routeConstants";
import { useAuthStore } from "../../../stores/authStore";
import { useTeacherWorkspace } from "../context/TeacherWorkspaceContext";

function TeacherDashboardContent() {
    const navigate = useNavigate();

    const {
        teacherName,
        stats,
        races,
        isDashboardLoading,
        dashboardError,
        openCreateRaceModal,
        openAllRacesModal,
        handleOpenRace,
    } = useTeacherWorkspace();

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isLoading = useAuthStore((state) => state.isLoading);

    const handleLogout = useCallback(async () => {
        await logout();
        navigate(ROUTES.LANDING, { replace: true });
    }, [logout, navigate]);

    return (
        <TeacherDashboardMain
            teacherName={teacherName ?? user?.displayName}
            isLoggingOut={isLoading}
            onLogout={handleLogout}
            stats={stats}
            races={races}
            isRacesLoading={isDashboardLoading}
            racesError={dashboardError}
            onCreateRaceClick={openCreateRaceModal}
            onOpenRace={handleOpenRace}
            onShowAllRacesClick={openAllRacesModal}
        />
    );
}

export default function TeacherDashboardPage() {
    return (
        <AppShell>
            <TeacherDashboardLayout>
                <TeacherDashboardContent />
            </TeacherDashboardLayout>
        </AppShell>
    );
}