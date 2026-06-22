import Badge from "../../../../shared/components/ui/Badge";
import {
    RACE_STATUSES,
    RACE_STATUS_BADGE_CLASSES,
} from "../../config/raceStatusConfig";

export default function RaceStatusBadge({ status, labels = {} }) {
    const safeStatus = status ?? RACE_STATUSES.UNKNOWN;
    const label = labels[safeStatus] ?? labels.unknown ?? safeStatus;
    const badgeClasses =
        RACE_STATUS_BADGE_CLASSES[safeStatus] ??
        RACE_STATUS_BADGE_CLASSES[RACE_STATUSES.UNKNOWN];

    return (
        <Badge className={badgeClasses}>
            {label}
        </Badge>
    );
}