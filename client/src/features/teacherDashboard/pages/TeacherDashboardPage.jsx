import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../layouts/AppShell";
import TeacherDashboardLayout from "../../../layouts/TeacherDashboardLayout";
import TeacherDashboardMain from "../components/general/TeacherDashboardMain.jsx";
import CreateRaceModal from "../components/createRace/CreateRaceModal";
import { ROUTES } from "../../../constants/routeConstants";
import { useAuthStore } from "../../../stores/authStore";
import { useCreateRaceModal } from "../hooks/useCreateRaceModal";
import { useTeacherDashboardData } from "../hooks/useTeacherDashboardData";
import { useSubjects } from "../hooks/useSubjects";
import { useRaceNavigation } from "../hooks/useRaceNavigation";

export default function TeacherDashboardPage() {
    const navigate = useNavigate();
    const [isCreatingRace, setIsCreatingRace] = useState(false);
    const [createRaceError, setCreateRaceError] = useState(null);
    const {
        isCreateRaceModalOpen,
        openCreateRaceModal,
        closeCreateRaceModal,
    } = useCreateRaceModal();
    const {
        teacherName,
        stats,
        races,
        isLoading: isDashboardLoading,
        error: dashboardError,
        createRaceAndRefresh,
    } = useTeacherDashboardData();
    const {
        subjects,
        isLoadingSubjects,
        subjectsError,
    } = useSubjects();
    const { handleOpenRace } = useRaceNavigation();

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isLoading = useAuthStore((state) => state.isLoading);

    async function handleLogout() {
        await logout();
        navigate(ROUTES.LOGIN, { replace: true });
    }

    function handleDashboardClick() {
        navigate(ROUTES.TEACHER_DASHBOARD);
    }

    function handleRacesClick() {
        navigate(ROUTES.TEACHER_DASHBOARD);
    }

    async function handleCreateRaceSubmit(payload) {
        setIsCreatingRace(true);
        setCreateRaceError(null);

        try {
            await createRaceAndRefresh(payload);
            closeCreateRaceModal();
        } catch (requestError) {
            setCreateRaceError(requestError?.message ?? null);
        } finally {
            setIsCreatingRace(false);
        }
    }

    return (
        <AppShell>
            <TeacherDashboardLayout
                onDashboardClick={handleDashboardClick}
                onRacesClick={handleRacesClick}
                onCreateRaceClick={openCreateRaceModal}
            >
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
                />
            </TeacherDashboardLayout>

            <CreateRaceModal
                isOpen={isCreateRaceModalOpen}
                onClose={closeCreateRaceModal}
                onSubmit={handleCreateRaceSubmit}
                subjects={subjects}
                isSubmitting={isCreatingRace}
                isLoadingSubjects={isLoadingSubjects}
                error={createRaceError ?? subjectsError}
            />
        </AppShell>
    );
}
