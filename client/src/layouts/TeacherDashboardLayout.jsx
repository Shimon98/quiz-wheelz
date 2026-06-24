import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import TeacherSidebar from "../features/teacherDashboard/components/sidebar/TeacherSidebar";
import CreateRaceModal from "../features/teacherDashboard/components/createRace/CreateRaceModal";
import AllRacesModal from "../features/teacherDashboard/components/races/AllRacesModal";

import { getTeacherDashboardAsset } from "../features/teacherDashboard/constants/teacherDashboardAssets";
import { TEACHER_DASHBOARD_LAYOUT_STYLES } from "../features/teacherDashboard/styles/dashboardUiStyles";
import {
    TEACHER_DASHBOARD_CONTENT,
    TEACHER_DASHBOARD_RACE_CONTENT,
} from "../features/teacherDashboard/content/teacherDashboardContent";

import { TeacherWorkspaceContext } from "../features/teacherDashboard/context/TeacherWorkspaceContext";
import { useCreateRaceModal } from "../features/teacherDashboard/hooks/useCreateRaceModal";
import { useTeacherDashboardData } from "../features/teacherDashboard/hooks/useTeacherDashboardData";
import { useSubjects } from "../features/teacherDashboard/hooks/useSubjects";
import { useRaceNavigation } from "../features/teacherDashboard/hooks/useRaceNavigation";

import { ROUTES } from "../constants/routeConstants";
import { useLocaleContent } from "../constants/localeConstants";
import { useLanguageStore } from "../stores/languageStore";
import { useAuthStore } from "../stores/authStore";
import { getLanguageDirection } from "../utils/languageDirectionUtils";

export default function TeacherDashboardLayout({ children }) {
    const navigate = useNavigate();

    const [isCreatingRace, setIsCreatingRace] = useState(false);
    const [createRaceError, setCreateRaceError] = useState(null);
    const [isAllRacesModalOpen, setIsAllRacesModalOpen] = useState(false);

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

    const logout = useAuthStore((state) => state.logout);
    const isLoggingOut = useAuthStore((state) => state.isLoading);

    const handleLogout = useCallback(async () => {
        await logout();
        navigate(ROUTES.LOGIN, { replace: true });
    }, [logout, navigate]);

    const language = useLanguageStore((state) => state.language);
    const direction = getLanguageDirection(language);
    const racePreviewContent = useLocaleContent(TEACHER_DASHBOARD_CONTENT).racePreview;
    const raceContent = useLocaleContent(TEACHER_DASHBOARD_RACE_CONTENT);

    const generalBackground = getTeacherDashboardAsset("generalBackground");

    function handleDashboardClick() {
        navigate(ROUTES.TEACHER_DASHBOARD);
    }

    function openAllRacesModal() {
        setIsAllRacesModalOpen(true);
    }

    function closeAllRacesModal() {
        setIsAllRacesModalOpen(false);
    }

    function handleOpenRaceFromAllRaces(race) {
        closeAllRacesModal();
        handleOpenRace(race);
    }

    function handleCreateRaceFromAllRaces() {
        closeAllRacesModal();
        openCreateRaceModal();
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

    const workspaceValue = {
        teacherName,
        stats,
        races,
        isDashboardLoading,
        dashboardError,
        openAllRacesModal,
        closeAllRacesModal,
        openCreateRaceModal,
        closeCreateRaceModal,
        handleOpenRace,
    };

    return (
        <TeacherWorkspaceContext.Provider value={workspaceValue}>
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
                        onDashboardClick={handleDashboardClick}
                        onRacesClick={openAllRacesModal}
                        onCreateRaceClick={openCreateRaceModal}
                        teacherName={teacherName}
                        onLogout={handleLogout}
                        isLoggingOut={isLoggingOut}
                    />

                    <main className={TEACHER_DASHBOARD_LAYOUT_STYLES.main}>
                        {children}
                    </main>
                </div>

                <CreateRaceModal
                    isOpen={isCreateRaceModalOpen}
                    onClose={closeCreateRaceModal}
                    onSubmit={handleCreateRaceSubmit}
                    subjects={subjects}
                    isSubmitting={isCreatingRace}
                    isLoadingSubjects={isLoadingSubjects}
                    error={createRaceError ?? subjectsError}
                />

                <AllRacesModal
                    isOpen={isAllRacesModalOpen}
                    onClose={closeAllRacesModal}
                    races={races}
                    content={racePreviewContent}
                    raceContent={raceContent}
                    language={language}
                    direction={direction}
                    onOpenRace={handleOpenRaceFromAllRaces}
                    onCreateRaceClick={handleCreateRaceFromAllRaces}
                />
            </div>
        </TeacherWorkspaceContext.Provider>
    );
}