import { motion } from "framer-motion";
import { ArrowRight, Flag } from "lucide-react";
import Button from "../../../../shared/components/ui/Button";
import RaceStatusBadge from "../races/RaceStatusBadge";
import { WAITING_ROOM_HEADER_STYLES } from "../../styles/raceWaitingRoomStyles";
import { ENTRANCE_TRANSITION, FADE_UP_VARIANTS } from "../../styles/raceWaitingRoomMotion";

export default function RaceWaitingRoomHeader({
                                                  raceTitle,
                                                  raceStatus,
                                                  statusLabels,
                                                  content,
                                                  onBackToRaces,
                                              }) {
    const title = raceTitle || content.titleFallback;

    return (
        <motion.section
            className={WAITING_ROOM_HEADER_STYLES.wrapper}
            dir="auto"
            initial="hidden"
            animate="visible"
            variants={FADE_UP_VARIANTS}
            transition={ENTRANCE_TRANSITION}
        >
            <div className={WAITING_ROOM_HEADER_STYLES.titleGroup}>
                <Button
                    onClick={onBackToRaces}
                    variant="secondary"
                    size="sm"
                    className={WAITING_ROOM_HEADER_STYLES.backButton}
                >
                    <ArrowRight size={18} aria-hidden="true" />
                    <span>{content.backToRaces}</span>
                </Button>

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
        </motion.section>
    );
}