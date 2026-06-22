import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../../layouts/AppShell";
import TeacherDashboardLayout from "../../../layouts/TeacherDashboardLayout";
import { ROUTES } from "../../../constants/routeConstants";
import { useLocaleContent } from "../../../constants/localeConstants";
import { getTeacherRaceRoom } from "../../../api/teacherApi";
import {TEACHER_DASHBOARD_RACE_CONTENT, TEACHER_RACE_WAITING_ROOM_CONTENT,} from "../content/teacherDashboardContent";
import DashboardErrorState from "../components/ui/DashboardErrorState";
import DashboardLoadingState from "../components/ui/DashboardLoadingState";
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
    const [raceRoom, setRaceRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        queueMicrotask(() => {
            setIsLoading(true);
            setError(null);
            getTeacherRaceRoom(raceId)
                .then(setRaceRoom)
                .catch(setError)
                .finally(() => setIsLoading(false));
        });
    }, [raceId]);

    function handleDashboardClick() {
        navigate(ROUTES.TEACHER_DASHBOARD);
    }

    function handleRacesClick() {
        navigate(ROUTES.TEACHER_DASHBOARD);
    }

    function handleCopyCode() {
        if (raceRoom?.roomCode) {
            navigator.clipboard?.writeText(raceRoom.roomCode);
        }
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
        <AppShell>
            <TeacherDashboardLayout
                onDashboardClick={handleDashboardClick}
                onRacesClick={handleRacesClick}
            >
                <div className={WAITING_ROOM_LAYOUT_STYLES.page}>
                    {isLoading && <DashboardLoadingState />}

                    {!isLoading && error && (
                        <DashboardErrorState message={content.loadingError} />
                    )}

                    {!isLoading && !error && raceRoom && (
                        <>
                            <RaceWaitingRoomHeader
                                raceTitle={raceRoom.title}
                                raceStatus={raceRoom.status}
                                statusLabels={raceContent.statusLabels}
                                content={content.header}
                                onBackToRaces={handleRacesClick}
                            />

                            <div className={WAITING_ROOM_LAYOUT_STYLES.contentGrid}>
                                <main className={WAITING_ROOM_LAYOUT_STYLES.mainColumn}>
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
                                </main>

                                <RaceWaitingRoomSidePanel
                                    race={raceRoom}
                                    content={content}
                                    onCancelRace={handleCancelRace}
                                    canCancelRace={false}
                                />
                            </div>
                        </>
                    )}
                </div>
            </TeacherDashboardLayout>
        </AppShell>
    );
}