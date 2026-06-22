import RoomCodeQrCard from "./RoomCodeQrCard";
import RaceWaitingRoomInfoCards from "./RaceWaitingRoomInfoCards";
import RaceWaitingRoomPrimaryActions from "./RaceWaitingRoomPrimaryActions";
import { WAITING_ROOM_CARD_STYLES } from "../../styles/raceWaitingRoomStyles";

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
        <section className={WAITING_ROOM_CARD_STYLES.joinPanel}>
            <RoomCodeQrCard
                roomCode={race.roomCode}
                content={content.joinPanel}
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

            <RaceWaitingRoomInfoCards
                race={race}
                content={content.infoCards}
            />
        </section>
    );
}