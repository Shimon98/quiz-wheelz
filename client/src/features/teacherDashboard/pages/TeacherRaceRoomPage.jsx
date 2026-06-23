import { MotionConfig } from "framer-motion";
import { useParams } from "react-router-dom";

import AppShell from "../../../layouts/AppShell";
import TeacherDashboardLayout from "../../../layouts/TeacherDashboardLayout";
import { useLocaleContent } from "../../../constants/localeConstants";

import {
    TEACHER_DASHBOARD_RACE_CONTENT,
    TEACHER_RACE_WAITING_ROOM_CONTENT,
} from "../content/teacherDashboardContent";

import { useTeacherRaceRoomData } from "../hooks/useTeacherRaceRoomData";
import { useTeacherWorkspace } from "../context/TeacherWorkspaceContext";

import DashboardErrorState from "../components/ui/DashboardErrorState";
import DashboardLoadingState from "../components/ui/DashboardLoadingState";
import RaceWaitingRoomHeader from "../components/raceWaitingRoom/RaceWaitingRoomHeader";
import RaceWaitingRoomJoinPanel from "../components/raceWaitingRoom/RaceWaitingRoomJoinPanel";
import RaceWaitingRoomParticipantsGrid from "../components/raceWaitingRoom/RaceWaitingRoomParticipantsGrid";
import RaceWaitingRoomSidePanel from "../components/raceWaitingRoom/RaceWaitingRoomSidePanel";

import { WAITING_ROOM_LAYOUT_STYLES } from "../styles/raceWaitingRoomStyles";

function TeacherRaceRoomContent() {
    const { raceId } = useParams();

    const { openAllRacesModal } = useTeacherWorkspace();

    const content = useLocaleContent(TEACHER_RACE_WAITING_ROOM_CONTENT);
    const raceContent = useLocaleContent(TEACHER_DASHBOARD_RACE_CONTENT);

    const {
        raceRoom,
        isLoading,
        error,
    } = useTeacherRaceRoomData(raceId);

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
        <section className={WAITING_ROOM_LAYOUT_STYLES.panel}>
            <RaceWaitingRoomHeader
                raceTitle={raceRoom?.title}
                raceStatus={raceRoom?.status}
                statusLabels={raceContent.statusLabels}
                content={content.header}
                onBackToRaces={openAllRacesModal}
            />

            <div className={WAITING_ROOM_LAYOUT_STYLES.body}>
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
        </section>
    );
}

export default function TeacherRaceRoomPage() {
    return (
        <MotionConfig reducedMotion="user">
            <AppShell>
                <TeacherDashboardLayout>
                    <TeacherRaceRoomContent />
                </TeacherDashboardLayout>
            </AppShell>
        </MotionConfig>
    );
}