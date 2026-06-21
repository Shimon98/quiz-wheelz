import { Copy, Edit3, Play, Share2 } from "lucide-react";
import DashboardButton from "../ui/DashboardButton";
import { WAITING_ROOM_BUTTON_STYLES } from "../../styles/raceWaitingRoomStyles";

export default function RaceWaitingRoomPrimaryActions({
                                                          content,
                                                          onCopyCode,
                                                          onShareLink,
                                                          onEditRace,
                                                          onStartRace,
                                                          canEditRace = false,
                                                          canStartRace = false,
                                                      }) {
    return (
        <div className={WAITING_ROOM_BUTTON_STYLES.actionsGrid}>
            <DashboardButton
                onClick={onCopyCode}
                variant="secondary"
                className={WAITING_ROOM_BUTTON_STYLES.secondaryAction}
            >
                <Copy
                    size={18}
                    aria-hidden="true"
                    className={WAITING_ROOM_BUTTON_STYLES.icon}
                />
                <span>{content.copyCode}</span>
            </DashboardButton>

            <DashboardButton
                onClick={onShareLink}
                variant="secondary"
                className={WAITING_ROOM_BUTTON_STYLES.secondaryAction}
            >
                <Share2
                    size={18}
                    aria-hidden="true"
                    className={WAITING_ROOM_BUTTON_STYLES.icon}
                />
                <span>{content.shareLink}</span>
            </DashboardButton>

            <DashboardButton
                onClick={onEditRace}
                variant="secondary"
                disabled={!canEditRace}
                className={WAITING_ROOM_BUTTON_STYLES.secondaryAction}
            >
                <Edit3
                    size={18}
                    aria-hidden="true"
                    className={WAITING_ROOM_BUTTON_STYLES.icon}
                />
                <span>{content.editRace}</span>
            </DashboardButton>

            <DashboardButton
                onClick={onStartRace}
                variant="primary"
                disabled={!canStartRace}
                className={WAITING_ROOM_BUTTON_STYLES.startRace}
            >
                <Play
                    size={20}
                    aria-hidden="true"
                    className={WAITING_ROOM_BUTTON_STYLES.icon}
                />
                <span>{content.startRace}</span>
            </DashboardButton>
        </div>
    );
}