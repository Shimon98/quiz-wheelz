import { QrCode } from "lucide-react";
import { WAITING_ROOM_CODE_STYLES } from "../../styles/raceWaitingRoomStyles";

export default function RoomCodeQrCard({
                                           roomCode,
                                           content,
                                       }) {
    const displayRoomCode = roomCode || content.roomCodeFallback;

    return (
        <section className={WAITING_ROOM_CODE_STYLES.wrapper}>
            <div className={WAITING_ROOM_CODE_STYLES.codeArea}>
                <p className={WAITING_ROOM_CODE_STYLES.codeLabel}>
                    {content.roomCodeTitle}
                </p>

                <p className={WAITING_ROOM_CODE_STYLES.code}>
                    {displayRoomCode}
                </p>

                <p className={WAITING_ROOM_CODE_STYLES.description}>
                    {content.roomCodeDescription}
                </p>
            </div>

            <div
                className={WAITING_ROOM_CODE_STYLES.qrBox}
                aria-label={content.qrAriaLabel}
            >
                <QrCode
                    size={64}
                    aria-hidden="true"
                    className={WAITING_ROOM_CODE_STYLES.qrIcon}
                />

                <span className={WAITING_ROOM_CODE_STYLES.qrText}>
                    {content.qrText}
                </span>
            </div>
        </section>
    );
}
