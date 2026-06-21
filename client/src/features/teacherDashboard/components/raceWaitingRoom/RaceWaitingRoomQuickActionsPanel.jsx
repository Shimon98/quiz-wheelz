import { Bell, XCircle } from "lucide-react";
import DashboardButton from "../ui/DashboardButton";
import {
    WAITING_ROOM_QUICK_ACTION_ITEMS,
    WAITING_ROOM_QUICK_ACTION_KEYS,
} from "../../config/raceWaitingRoomConfig";
import {
    WAITING_ROOM_BUTTON_STYLES,
    WAITING_ROOM_SIDE_PANEL_STYLES,
    WAITING_ROOM_TEXT_STYLES,
} from "../../styles/raceWaitingRoomStyles";



export default function RaceWaitingRoomQuickActionsPanel({
                                                             content,
                                                             onRemindStudents,
                                                             onCancelRace,
                                                             canCancelRace = false,
                                                         }) {

    const QUICK_ACTION_ICONS = Object.freeze({
        [WAITING_ROOM_QUICK_ACTION_KEYS.REMIND_STUDENTS]: Bell,
        [WAITING_ROOM_QUICK_ACTION_KEYS.CANCEL_RACE]: XCircle,
    });

    function getActionHandler(actionType, handlers) {
        if (actionType === "remind") {
            return handlers.onRemindStudents;}
        if (actionType === "cancel") {
            return handlers.onCancelRace;}
        return undefined;
    }

    function getActionDisabled(item, canCancelRace) {
        if (item.actionType === "cancel") {
            return !canCancelRace;}
        return item.disabled;
    }

    const handlers = {onRemindStudents, onCancelRace,};

    return (
        <section className={WAITING_ROOM_SIDE_PANEL_STYLES.panel}>
            <h2 className={WAITING_ROOM_TEXT_STYLES.sectionTitle}>
                {content.title}
            </h2>

            <div className={WAITING_ROOM_SIDE_PANEL_STYLES.list}>
                {WAITING_ROOM_QUICK_ACTION_ITEMS.map((item) => {
                    const Icon = QUICK_ACTION_ICONS[item.key];
                    const isDisabled = getActionDisabled(item, canCancelRace);
                    const onClick = getActionHandler(item.actionType, handlers);

                    return (
                        <DashboardButton
                            key={item.key}
                            onClick={onClick}
                            variant={item.variant}
                            disabled={isDisabled}
                            className={WAITING_ROOM_BUTTON_STYLES.sideAction}
                        >
                            {Icon && (
                                <Icon
                                    size={18}
                                    aria-hidden="true"
                                    className={WAITING_ROOM_BUTTON_STYLES.icon}
                                />
                            )}

                            <span>{content[item.contentKey]}</span>
                        </DashboardButton>
                    );
                })}
            </div>

            <p className={WAITING_ROOM_TEXT_STYLES.hint}>
                {content.futureHint}
            </p>
        </section>
    );
}