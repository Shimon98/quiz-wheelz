import { motion } from "framer-motion";
import RoomCodeQrCard from "./RoomCodeQrCard";
import RaceWaitingRoomInfoCards from "./RaceWaitingRoomInfoCards";
import RaceWaitingRoomPrimaryActions from "./RaceWaitingRoomPrimaryActions";
import { WAITING_ROOM_CARD_STYLES } from "../../styles/raceWaitingRoomStyles";
import { ENTRANCE_TRANSITION, FADE_UP_VARIANTS } from "../../styles/raceWaitingRoomMotion";

const JOIN_PANEL_TRANSITION = Object.freeze({ ...ENTRANCE_TRANSITION, delay: 0.05 });

export default function RaceWaitingRoomJoinPanel({
                                                     race,
                                                     content,
                                                     onCopyCode,
                                                     onShareLink,
                                                     onEditRace,
                                                     onStartRace,
                                                     canEditRace = false,
                                                     canStartRace = false,
                                                 }) {
    return (
        <motion.section
            className={WAITING_ROOM_CARD_STYLES.joinPanel}
            initial="hidden"
            animate="visible"
            variants={FADE_UP_VARIANTS}
            transition={JOIN_PANEL_TRANSITION}
        >
            <RoomCodeQrCard
                roomCode={race.roomCode}
                content={content.joinPanel}
            />

            <RaceWaitingRoomInfoCards
                race={race}
                content={content.infoCards}
            />

            <RaceWaitingRoomPrimaryActions
                content={content.actions}
                onCopyCode={onCopyCode}
                onShareLink={onShareLink}
                onEditRace={onEditRace}
                onStartRace={onStartRace}
                canEditRace={canEditRace}
                canStartRace={canStartRace}
            />
        </motion.section>
    );
}