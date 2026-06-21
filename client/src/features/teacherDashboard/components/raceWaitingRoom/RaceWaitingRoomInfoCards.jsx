import { BookOpen, UserCheck, Users } from "lucide-react";
import { WAITING_ROOM_INFO_CARD_ITEMS, WAITING_ROOM_INFO_CARD_KEYS } from "../../config/raceWaitingRoomConfig";
import {
    WAITING_ROOM_INFO_STYLES,
    WAITING_ROOM_TEXT_STYLES,
} from "../../styles/raceWaitingRoomStyles";

const INFO_CARD_ICONS = Object.freeze({
    [WAITING_ROOM_INFO_CARD_KEYS.SUBJECT]: BookOpen,
    [WAITING_ROOM_INFO_CARD_KEYS.MAX_PLAYERS]: Users,
    [WAITING_ROOM_INFO_CARD_KEYS.JOINED_PLAYERS]: UserCheck,
});

export default function RaceWaitingRoomInfoCards({
                                                     race,
                                                     content,
                                                 }) {
    const valuesByField = {
        subject: race.subjectName || content.subject.emptyValue,
        maxPlayers: race.maxPlayers ?? content.maxPlayers.emptyValue,
        joinedPlayers: race.currentPlayers ?? content.joinedPlayers.emptyValue,
    };

    return (
        <div className={WAITING_ROOM_INFO_STYLES.grid}>
            {WAITING_ROOM_INFO_CARD_ITEMS.map((item) => {
                const Icon = INFO_CARD_ICONS[item.key];
                const itemContent = content[item.contentKey];
                const value = valuesByField[item.valueField];

                return (
                    <article
                        key={item.key}
                        className={WAITING_ROOM_INFO_STYLES.card}
                    >
                        <div className={WAITING_ROOM_INFO_STYLES.content}>
                            <p className={WAITING_ROOM_TEXT_STYLES.label}>
                                {itemContent.label}
                            </p>

                            <p className={WAITING_ROOM_TEXT_STYLES.value}>
                                {value}
                            </p>
                        </div>

                        <div className={WAITING_ROOM_INFO_STYLES.icon}>
                            {Icon && (
                                <Icon
                                    aria-hidden="true"
                                    className={WAITING_ROOM_INFO_STYLES.iconSvg}
                                />
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}