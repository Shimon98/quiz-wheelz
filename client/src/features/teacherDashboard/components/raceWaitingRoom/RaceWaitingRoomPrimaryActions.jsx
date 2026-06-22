import { useEffect, useRef, useState } from "react";
import { Check, Copy, Edit3, Play, Share2 } from "lucide-react";
import DashboardButton from "../ui/DashboardButton";
import { WAITING_ROOM_BUTTON_STYLES } from "../../styles/raceWaitingRoomStyles";

const COPY_CONFIRMATION_MS = 1600;

export default function RaceWaitingRoomPrimaryActions({
                                                          content,
                                                          onCopyCode,
                                                          onShareLink,
                                                          onEditRace,
                                                          onStartRace,
                                                          canEditRace = false,
                                                          canStartRace = false,
                                                      }) {
    const [isCopyConfirmed, setIsCopyConfirmed] = useState(false);
    const confirmationTimeoutRef = useRef(null);

    useEffect(() => {
        return () => clearTimeout(confirmationTimeoutRef.current);
    }, []);

    function handleCopyClick() {
        onCopyCode?.();
        setIsCopyConfirmed(true);
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = setTimeout(
            () => setIsCopyConfirmed(false),
            COPY_CONFIRMATION_MS,
        );
    }

    return (
        <div className={WAITING_ROOM_BUTTON_STYLES.actionsGrid}>
            <DashboardButton
                onClick={handleCopyClick}
                variant="secondary"
                className={WAITING_ROOM_BUTTON_STYLES.secondaryAction}
            >
                {isCopyConfirmed ? (
                    <Check
                        size={18}
                        aria-hidden="true"
                        className={WAITING_ROOM_BUTTON_STYLES.confirmedIcon}
                    />
                ) : (
                    <Copy
                        size={18}
                        aria-hidden="true"
                        className={WAITING_ROOM_BUTTON_STYLES.icon}
                    />
                )}
                <span>{isCopyConfirmed ? content.copyCodeConfirmed : content.copyCode}</span>
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
                variant="successCta"
                size="lg"
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