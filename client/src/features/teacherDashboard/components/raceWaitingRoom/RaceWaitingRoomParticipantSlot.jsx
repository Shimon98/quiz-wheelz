import { Car } from "lucide-react";
import { cx } from "../../../../utils/classNameUtils";
import { WAITING_ROOM_PARTICIPANT_STYLES } from "../../styles/raceWaitingRoomStyles";

export default function RaceWaitingRoomParticipantSlot({
                                                           player,
                                                           slotNumber,
                                                           colorClass,
                                                           content,
                                                           vehicleImageSrc,
                                                       }) {
    const hasPlayer = Boolean(player);
    const playerName =
        player?.displayName ||
        player?.name ||
        `${content.playerFallback} ${slotNumber}`;

    return (
        <article
            className={cx(
                WAITING_ROOM_PARTICIPANT_STYLES.slot,
                hasPlayer
                    ? WAITING_ROOM_PARTICIPANT_STYLES.joined
                    : WAITING_ROOM_PARTICIPANT_STYLES.empty,
            )}
        >
            <div
                className={cx(
                    WAITING_ROOM_PARTICIPANT_STYLES.numberBadge,
                    colorClass,
                )}
            >
                {slotNumber}
            </div>

            <div
                className={
                    hasPlayer
                        ? WAITING_ROOM_PARTICIPANT_STYLES.avatar
                        : WAITING_ROOM_PARTICIPANT_STYLES.placeholderAvatar
                }
            >
                {hasPlayer && vehicleImageSrc && (
                    <img
                        src={vehicleImageSrc}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                        className={WAITING_ROOM_PARTICIPANT_STYLES.vehicleImage}
                    />
                )}

                {(!hasPlayer || !vehicleImageSrc) && (
                    <Car
                        aria-hidden="true"
                        className={
                            WAITING_ROOM_PARTICIPANT_STYLES.vehiclePlaceholderIcon
                        }
                    />
                )}
            </div>

            {hasPlayer && (
                <>
                    <p className={WAITING_ROOM_PARTICIPANT_STYLES.playerName}>
                        {playerName}
                    </p>

                    <div className={WAITING_ROOM_PARTICIPANT_STYLES.joinedBadge}>
                        {content.joinedMark}
                    </div>
                </>
            )}

            {!hasPlayer && (
                <p className={WAITING_ROOM_PARTICIPANT_STYLES.emptyText}>
                    {content.emptySlot}
                </p>
            )}
        </article>
    );
}