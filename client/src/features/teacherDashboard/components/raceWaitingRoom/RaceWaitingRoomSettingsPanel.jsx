import { Clock, Gamepad2, Route, Shuffle, Trophy } from "lucide-react";
import {WAITING_ROOM_SETTINGS_ITEMS, WAITING_ROOM_SETTINGS_KEYS,} from "../../config/raceWaitingRoomConfig";
import {WAITING_ROOM_SIDE_PANEL_STYLES, WAITING_ROOM_TEXT_STYLES,} from "../../styles/raceWaitingRoomStyles";
import { cx } from "../../../../utils/classNameUtils";

export default function RaceWaitingRoomSettingsPanel({race, content,}) {
    const SETTINGS_ICONS = Object.freeze({
        [WAITING_ROOM_SETTINGS_KEYS.RACE_TYPE]: Gamepad2,
        [WAITING_ROOM_SETTINGS_KEYS.WIN_CONDITION]: Trophy,
        [WAITING_ROOM_SETTINGS_KEYS.QUESTION_TIME]: Clock,
        [WAITING_ROOM_SETTINGS_KEYS.TRACK_LENGTH]: Route,
        [WAITING_ROOM_SETTINGS_KEYS.QUESTION_ORDER]: Shuffle,
    });

    function getSettingValue(item, race, itemContent) {
        if (item.valueType === "raceDistance" && race?.totalDistance) {
            return `${race.totalDistance} ${itemContent.valueUnit}`;}
        return itemContent.value || itemContent.valueFallback;
    }


    return (
        <section className={WAITING_ROOM_SIDE_PANEL_STYLES.section}>
            <h2 className={WAITING_ROOM_TEXT_STYLES.sectionTitle}>
                {content.title}
            </h2>

            <div className={WAITING_ROOM_SIDE_PANEL_STYLES.list}>
                {WAITING_ROOM_SETTINGS_ITEMS.map((item, index) => {
                    const itemContent = content[item.contentKey];
                    const Icon = SETTINGS_ICONS[item.key];
                    const value = getSettingValue(item, race, itemContent);
                    const iconVariant =
                        WAITING_ROOM_SIDE_PANEL_STYLES.itemIconVariants[
                            index % WAITING_ROOM_SIDE_PANEL_STYLES.itemIconVariants.length
                        ];

                    return (
                        <article
                            key={item.key}
                            className={WAITING_ROOM_SIDE_PANEL_STYLES.item}
                        >
                            <div className={WAITING_ROOM_SIDE_PANEL_STYLES.itemLeft}>
                                <div className={cx(WAITING_ROOM_SIDE_PANEL_STYLES.itemIcon, iconVariant)}>
                                    {Icon && (
                                        <Icon
                                            size={18}
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>

                                <span className={WAITING_ROOM_SIDE_PANEL_STYLES.itemLabel}>
                                    {itemContent.label}
                                </span>
                            </div>

                            <strong className={WAITING_ROOM_SIDE_PANEL_STYLES.itemValue}>
                                {value}
                            </strong>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}