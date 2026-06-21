import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../../layouts/AppShell";
import TeacherDashboardLayout from "../../../layouts/TeacherDashboardLayout";
import { ROUTES } from "../../../constants/routeConstants";
import { useLocaleContent } from "../../../constants/localeConstants";
import { getTeacherRaceRoom } from "../../../api/teacherApi";
import {
    TEACHER_DASHBOARD_RACE_CONTENT,
    TEACHER_RACE_ROOM_CONTENT,
} from "../content/teacherDashboardContent";
import DashboardErrorState from "../components/ui/DashboardErrorState";
import DashboardLoadingState from "../components/ui/DashboardLoadingState";
import RaceStatusBadge from "../components/races/RaceStatusBadge";
import RoomCodeCard from "../components/raceRoom/RoomCodeCard";
import RaceActionsPanel from "../components/raceRoom/RaceActionsPanel";
import RacePlayersPreview from "../components/raceRoom/RacePlayersPreview";

export default function TeacherRaceRoomPage() {
    const { raceId } = useParams();
    const navigate = useNavigate();
    const content = useLocaleContent(TEACHER_RACE_ROOM_CONTENT);
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

    return (
        <AppShell>
            <TeacherDashboardLayout
                onDashboardClick={handleDashboardClick}
                onRacesClick={handleRacesClick}
            >
                <div className="min-h-0 overflow-y-auto rounded-3xl bg-white/35 p-5">
                    {isLoading && <DashboardLoadingState />}

                    {!isLoading && error && (
                        <DashboardErrorState message={content.loadingError} />
                    )}

                    {!isLoading && !error && raceRoom && (
                        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                            <section className="rounded-3xl bg-white/85 p-6 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900">
                                            {raceRoom.title ?? content.pageTitleFallback}
                                        </h1>
                                        <p className="mt-2 text-sm font-bold text-slate-500">
                                            {content.subjectLabel}: {raceRoom.subjectName}
                                            {raceRoom.subjectCode
                                                ? ` · ${raceRoom.subjectCode}`
                                                : ""}
                                        </p>
                                    </div>

                                    <RaceStatusBadge
                                        status={raceRoom.status}
                                        labels={raceContent.statusLabels}
                                    />
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-bold text-slate-400">
                                            {content.statusLabel}
                                        </p>
                                        <p className="mt-1 text-sm font-extrabold text-slate-800">
                                            {raceContent.statusLabels[raceRoom.status] ??
                                                raceContent.statusLabels.unknown}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-bold text-slate-400">
                                            {content.playersLabel}
                                        </p>
                                        <p className="mt-1 text-sm font-extrabold text-slate-800">
                                            {raceRoom.currentPlayers ?? 0}/
                                            {raceRoom.maxPlayers ?? 0}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <RoomCodeCard
                                roomCode={raceRoom.roomCode}
                                content={content}
                                onCopyCode={handleCopyCode}
                                onShareLink={handleShareLink}
                            />

                            <RacePlayersPreview
                                players={raceRoom.players}
                                content={content}
                            />

                            <RaceActionsPanel race={raceRoom} content={content} />
                        </div>
                    )}
                </div>
            </TeacherDashboardLayout>
        </AppShell>
    );
}
