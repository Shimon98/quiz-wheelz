import RaceWaitingRoomQuickActionsPanel from "./RaceWaitingRoomQuickActionsPanel";
import RaceWaitingRoomSettingsPanel from "./RaceWaitingRoomSettingsPanel";
import { WAITING_ROOM_LAYOUT_STYLES } from "../../styles/raceWaitingRoomStyles";

export default function RaceWaitingRoomSidePanel({race, content, onRemindStudents, onCancelRace, canCancelRace = false,}) {
    return (
        <aside className={WAITING_ROOM_LAYOUT_STYLES.sideColumn}>
            <RaceWaitingRoomSettingsPanel
                race={race}
                content={content.settings}
            />

            <RaceWaitingRoomQuickActionsPanel
                content={content.quickActions}
                onRemindStudents={onRemindStudents}
                onCancelRace={onCancelRace}
                canCancelRace={canCancelRace}
            />
        </aside>
    );
}