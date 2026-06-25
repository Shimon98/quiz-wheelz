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
import { cx } from "../../../../utils/classNameUtils";
import { RACE_CARD_COMPACT_STYLES } from "../../styles/dashboardUiStyles";

export default function RaceCardActions({
                                            race,
                                            content,
                                            statusLabels,
                                            toneStyles,
                                            onOpenRace,
                                            onEditRace,
                                            onCancelRace,
                                            actionPresentation = "icon",
                                        }) {
    const canOpenRace = race.status !== RACE_STATUSES.CANCELLED && Boolean(onOpenRace);
    const canEdit = isRaceEditable(race.status) && Boolean(onEditRace);
    const canCancel = isRaceCancellable(race.status) && Boolean(onCancelRace);
    const actionLabel = getRaceActionLabel(race.status, content);
    const isExpandedAction = actionPresentation === "expanded";

    function handleOpenRace() {
        if (canOpenRace) {
            onOpenRace(race);
        }
    }

    return (
        <>
            <RaceStatusBadge status={race.status} labels={statusLabels} />

            <div
                className={cx(
                    RACE_CARD_COMPACT_STYLES.actions,
                    isExpandedAction && RACE_CARD_COMPACT_STYLES.actionsExpanded,
                )}
            >
                <Button
                    variant="plain"
                    size="icon"
                    onClick={handleOpenRace}
                    disabled={!canOpenRace}
                    aria-label={actionLabel}
                    className={cx(
                        RACE_CARD_COMPACT_STYLES.openButton,
                        isExpandedAction && RACE_CARD_COMPACT_STYLES.openButtonExpanded,
                        toneStyles.actionButton,
                    )}
                >
                    <Play
                        aria-hidden="true"
                        strokeWidth={2.8}
                        className={cx(
                            RACE_CARD_COMPACT_STYLES.openIcon,
                            toneStyles.actionIcon,
                        )}
                    />
                    {isExpandedAction && (
                        <span className={RACE_CARD_COMPACT_STYLES.openButtonLabel}>
                            {actionLabel}
                        </span>
                    )}
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
