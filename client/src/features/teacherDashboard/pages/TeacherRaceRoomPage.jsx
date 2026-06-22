import { useCallback } from "react";
import { MotionConfig } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

import AppShell from "../../../layouts/AppShell";
import TeacherDashboardLayout from "../../../layouts/TeacherDashboardLayout";
import { ROUTES } from "../../../constants/routeConstants";
import { useLocaleContent } from "../../../constants/localeConstants";
import { useAuthStore } from "../../../stores/authStore";

import {
    TEACHER_DASHBOARD_RACE_CONTENT,
    TEACHER_RACE_WAITING_ROOM_CONTENT,
} from "../content/teacherDashboardContent";

import { useTeacherRaceRoomData } from "../hooks/useTeacherRaceRoomData";

import DashboardErrorState from "../components/ui/DashboardErrorState";
import DashboardLoadingState from "../components/ui/DashboardLoadingState";
import TeacherHeroBanner from "../components/general/TeacherHeroBanner.jsx";
import RaceWaitingRoomHeader from "../components/raceWaitingRoom/RaceWaitingRoomHeader";
import RaceWaitingRoomJoinPanel from "../components/raceWaitingRoom/RaceWaitingRoomJoinPanel";
import RaceWaitingRoomParticipantsGrid from "../components/raceWaitingRoom/RaceWaitingRoomParticipantsGrid";
import RaceWaitingRoomSidePanel from "../components/raceWaitingRoom/RaceWaitingRoomSidePanel";

import { WAITING_ROOM_LAYOUT_STYLES } from "../styles/raceWaitingRoomStyles";

export default function TeacherRaceRoomPage() {
    const { raceId } = useParams();
    const navigate = useNavigate();

    const content = useLocaleContent(TEACHER_RACE_WAITING_ROOM_CONTENT);
    const raceContent = useLocaleContent(TEACHER_DASHBOARD_RACE_CONTENT);

    const {
        raceRoom,
        isLoading,
        error,
    } = useTeacherRaceRoomData(raceId);

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isLoggingOut = useAuthStore((state) => state.isLoading);

    function handleDashboardClick() {
        navigate(ROUTES.TEACHER_DASHBOARD);
    }

    function handleRacesClick() {
        navigate(ROUTES.TEACHER_DASHBOARD);
    }

    const handleLogout = useCallback(async () => {
        await logout();
        navigate(ROUTES.LOGIN, { replace: true });
    }, [logout, navigate]);

    function handleCopyCode() {
        if (!raceRoom?.roomCode) {
            return;
        }

        navigator.clipboard?.writeText(raceRoom.roomCode);
    }

    function handleShareLink() {
        const roomUrl = window.location.href;

        if (navigator.share) {
            navigator.share({ url: roomUrl }).catch(() => {});
            return;
        }

        navigator.clipboard?.writeText(roomUrl);
    }

    function handleEditRace() {
        // Future feature.
    }

    function handleStartRace() {
        // Future feature.
    }

    function handleCancelRace() {
        // Future feature.
    }

    return (
        <MotionConfig reducedMotion="user">
            <AppShell>
                <TeacherDashboardLayout
                    onDashboardClick={handleDashboardClick}
                    onRacesClick={handleRacesClick}
                >
                    <TeacherHeroBanner
                        size="compact"
                        teacherName={user?.displayName}
                        isLoggingOut={isLoggingOut}
                        onLogout={handleLogout}
                    />

                    {!isLoading && !error && raceRoom && (
                        <RaceWaitingRoomHeader
                            raceTitle={raceRoom.title}
                            raceStatus={raceRoom.status}
                            statusLabels={raceContent.statusLabels}
                            content={content.header}
                            onBackToRaces={handleRacesClick}
                        />
                    )}

                    <div className={WAITING_ROOM_LAYOUT_STYLES.page}>
                        {isLoading && <DashboardLoadingState />}

                        {!isLoading && error && (
                            <DashboardErrorState message={content.loadingError} />
                        )}

                        {!isLoading && !error && raceRoom && (
                            <div className={WAITING_ROOM_LAYOUT_STYLES.contentGrid}>
                                <div className={WAITING_ROOM_LAYOUT_STYLES.mainColumn}>
                                    <RaceWaitingRoomJoinPanel
                                        race={raceRoom}
                                        content={content}
                                        onCopyCode={handleCopyCode}
                                        onShareLink={handleShareLink}
                                        onEditRace={handleEditRace}
                                        onStartRace={handleStartRace}
                                        canEditRace={false}
                                        canStartRace={false}
                                    />

                                    <RaceWaitingRoomParticipantsGrid
                                        players={raceRoom.players}
                                        maxPlayers={raceRoom.maxPlayers}
                                        content={content.participants}
                                    />
                                </div>

                                <RaceWaitingRoomSidePanel
                                    race={raceRoom}
                                    content={content}
                                    onCancelRace={handleCancelRace}
                                    canCancelRace={false}
                                />
                            </div>
                        )}
                    </div>
                </TeacherDashboardLayout>
            </AppShell>
        </MotionConfig>
    );
}