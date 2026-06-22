import { motion } from "framer-motion";
import RaceWaitingRoomQuickActionsPanel from "./RaceWaitingRoomQuickActionsPanel";
import RaceWaitingRoomSettingsPanel from "./RaceWaitingRoomSettingsPanel";
import { WAITING_ROOM_LAYOUT_STYLES } from "../../styles/raceWaitingRoomStyles";
import { ENTRANCE_TRANSITION, FADE_UP_VARIANTS } from "../../styles/raceWaitingRoomMotion";

const SIDE_PANEL_TRANSITION = Object.freeze({ ...ENTRANCE_TRANSITION, delay: 0.08 });

export default function RaceWaitingRoomSidePanel({
    race,
    content,
    onCancelRace,
    canCancelRace = false,
}) {
    return (
        <motion.aside
            className={WAITING_ROOM_LAYOUT_STYLES.sideColumn}
            initial="hidden"
            animate="visible"
            variants={FADE_UP_VARIANTS}
            transition={SIDE_PANEL_TRANSITION}
        >
            <RaceWaitingRoomSettingsPanel
                race={race}
                content={content.settings}
            />

            <RaceWaitingRoomQuickActionsPanel
                content={content.quickActions}
                onCancelRace={onCancelRace}
                canCancelRace={canCancelRace}
            />
        </motion.aside>
    );
}
