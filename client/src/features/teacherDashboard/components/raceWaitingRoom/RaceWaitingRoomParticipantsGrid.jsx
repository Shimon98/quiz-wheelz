import {
    WAITING_ROOM_DEFAULT_MAX_PLAYERS,
    WAITING_ROOM_SLOT_COLORS,
} from "../../config/raceWaitingRoomConfig";
import {
    WAITING_ROOM_PARTICIPANT_STYLES,
    WAITING_ROOM_TEXT_STYLES,
} from "../../styles/raceWaitingRoomStyles";
import RaceWaitingRoomParticipantSlot from "./RaceWaitingRoomParticipantSlot";

export default function RaceWaitingRoomParticipantsGrid({
                                                            players = [],
                                                            maxPlayers = WAITING_ROOM_DEFAULT_MAX_PLAYERS,
                                                            content,
                                                            vehicleAssets = {},
                                                        }) {
    const slots = Array.from({ length: maxPlayers }, (_, index) => {
        const player = players[index];
        const vehicleImageSrc = player?.vehicleAssetKey
            ? vehicleAssets[player.vehicleAssetKey]
            : null;

        return {
            slotNumber: index + 1,
            player,
            colorClass: WAITING_ROOM_SLOT_COLORS[index % WAITING_ROOM_SLOT_COLORS.length],
            vehicleImageSrc,
        };
    });

    return (
        <section className={WAITING_ROOM_PARTICIPANT_STYLES.panel}>
            <h2 className={WAITING_ROOM_TEXT_STYLES.sectionTitle}>
                {content.title}
            </h2>

            <div className={WAITING_ROOM_PARTICIPANT_STYLES.grid}>
                {slots.map((slot) => (
                    <RaceWaitingRoomParticipantSlot
                        key={slot.slotNumber}
                        player={slot.player}
                        slotNumber={slot.slotNumber}
                        colorClass={slot.colorClass}
                        content={content}
                        vehicleImageSrc={slot.vehicleImageSrc}
                    />
                ))}
            </div>
        </section>
    );
}