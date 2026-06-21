import { ArrowRight, Flag } from "lucide-react";
import DashboardButton from "../ui/DashboardButton";
import RaceStatusBadge from "../races/RaceStatusBadge";
import { WAITING_ROOM_HEADER_STYLES } from "../../styles/raceWaitingRoomStyles";

export default function RaceWaitingRoomHeader({
                                                  raceTitle,
                                                  raceStatus,
                                                  statusLabels,
                                                  content,
                                                  onBackToRaces,
                                              }) {
    const title = raceTitle || content.titleFallback;

    return (
        <section className={WAITING_ROOM_HEADER_STYLES.wrapper} dir="auto">
            <div className={WAITING_ROOM_HEADER_STYLES.titleGroup}>
                <DashboardButton
                    onClick={onBackToRaces}
                    variant="secondary"
                    size="sm"
                    className={WAITING_ROOM_HEADER_STYLES.backButton}
                >
                    <ArrowRight size={18} aria-hidden="true" />
                    <span>{content.backToRaces}</span>
                </DashboardButton>

                <Flag
                    size={32}
                    aria-hidden="true"
                    className={WAITING_ROOM_HEADER_STYLES.titleIcon}
                />

                <h1 className={WAITING_ROOM_HEADER_STYLES.title}>
                    {title}
                </h1>
            </div>

            <RaceStatusBadge
                status={raceStatus}
                labels={statusLabels}
            />
        </section>
    );
}