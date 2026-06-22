import { motion } from "framer-motion";
import {
    WAITING_ROOM_DEFAULT_MAX_PLAYERS,
    WAITING_ROOM_SLOT_COLORS,
} from "../../config/raceWaitingRoomConfig";
import { WAITING_ROOM_PARTICIPANT_STYLES } from "../../styles/raceWaitingRoomStyles";
import { STAGGER_CONTAINER_VARIANTS } from "../../styles/raceWaitingRoomMotion";
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
            <motion.div
                className={WAITING_ROOM_PARTICIPANT_STYLES.grid}
                initial="hidden"
                animate="visible"
                variants={STAGGER_CONTAINER_VARIANTS}
            >
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
            </motion.div>
        </section>
    );
}