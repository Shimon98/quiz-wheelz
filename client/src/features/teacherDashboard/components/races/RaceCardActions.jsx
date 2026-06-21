import { RACE_STATUSES } from "../../config/raceStatusConfig";
import DashboardButton from "../ui/DashboardButton";
import {
    getRaceActionLabel,
    isRaceCancellable,
    isRaceEditable,
} from "../../utils/raceStatusUtils";
import RaceMoreMenu from "./RaceMoreMenu";

export default function RaceCardActions({
    race,
    content,
    onOpenRace,
    onEditRace,
    onCancelRace,
}) {
    const canOpenRace = race.status !== RACE_STATUSES.CANCELLED && Boolean(onOpenRace);
    const canEdit = isRaceEditable(race.status) && Boolean(onEditRace);
    const canCancel = isRaceCancellable(race.status) && Boolean(onCancelRace);

    function handleOpenRace() {
        if (canOpenRace) {
            onOpenRace(race);
        }
    }

    return (
        <div className="flex items-center justify-between gap-3">
            <DashboardButton
                onClick={handleOpenRace}
                disabled={!canOpenRace}
                className="flex-1"
            >
                {getRaceActionLabel(race.status, content)}
            </DashboardButton>

            <RaceMoreMenu
                race={race}
                content={content}
                canEdit={canEdit}
                canCancel={canCancel}
                onEditRace={onEditRace}
                onCancelRace={onCancelRace}
            />
        </div>
    );
}
