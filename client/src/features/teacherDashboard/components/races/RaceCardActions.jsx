import { Play } from "lucide-react";
import { RACE_STATUSES } from "../../config/raceStatusConfig";
import Button from "../../../../shared/components/ui/Button";
import {
    getRaceActionLabel,
    isRaceCancellable,
    isRaceEditable,
} from "../../utils/raceStatusUtils";
import RaceMoreMenu from "./RaceMoreMenu";
import RaceStatusBadge from "./RaceStatusBadge";
import { RACE_CARD_COMPACT_STYLES } from "../../styles/dashboardUiStyles";

export default function RaceCardActions({
                                            race,
                                            content,
                                            statusLabels,
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
        <>
            <RaceStatusBadge status={race.status} labels={statusLabels} />

            <div className={RACE_CARD_COMPACT_STYLES.actions}>
                <Button
                    variant="cta"
                    size="icon"
                    onClick={handleOpenRace}
                    disabled={!canOpenRace}
                    aria-label={getRaceActionLabel(race.status, content)}
                    className={RACE_CARD_COMPACT_STYLES.openButton}
                >
                    <Play
                        size={20}
                        aria-hidden="true"
                        strokeWidth={2.7}
                    />
                </Button>

                <RaceMoreMenu
                    race={race}
                    content={content}
                    canEdit={canEdit}
                    canCancel={canCancel}
                    onEditRace={onEditRace}
                    onCancelRace={onCancelRace}
                />
            </div>
        </>
    );
}