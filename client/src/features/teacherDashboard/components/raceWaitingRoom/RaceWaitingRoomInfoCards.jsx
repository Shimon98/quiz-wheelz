import { BookOpen, UserCheck, Users } from "lucide-react";
import { WAITING_ROOM_INFO_CARD_ITEMS, WAITING_ROOM_INFO_CARD_KEYS } from "../../config/raceWaitingRoomConfig";
import { cx } from "../../../../utils/classNameUtils";
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
            {WAITING_ROOM_INFO_CARD_ITEMS.map((item, index) => {
                const Icon = INFO_CARD_ICONS[item.key];
                const itemContent = content[item.contentKey];
                const value = valuesByField[item.valueField];
                const iconVariant =
                    WAITING_ROOM_INFO_STYLES.iconVariants[
                        index % WAITING_ROOM_INFO_STYLES.iconVariants.length
                    ];
                const cardVariant =
                    WAITING_ROOM_INFO_STYLES.cardVariants[
                        index % WAITING_ROOM_INFO_STYLES.cardVariants.length
                    ];

                return (
                    <article
                        key={item.key}
                        className={cx(WAITING_ROOM_INFO_STYLES.card, cardVariant)}
                    >
                        <div className={cx(WAITING_ROOM_INFO_STYLES.icon, iconVariant)}>
                            {Icon && (
                                <Icon
                                    aria-hidden="true"
                                    className={WAITING_ROOM_INFO_STYLES.iconSvg}
                                />
                            )}
                        </div>

                        <div className={WAITING_ROOM_INFO_STYLES.content}>
                            <p className={WAITING_ROOM_TEXT_STYLES.label}>
                                {itemContent.label}
                            </p>

                            <p className={WAITING_ROOM_TEXT_STYLES.value}>
                                {value}
                            </p>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}