import {
    RACE_STATUS_BADGE_CLASSES,
} from "../../config/raceStatusConfig";

export default function RaceStatusBadge({ status, labels = {} }) {
    const label = labels[status] ?? labels.unknown ?? status;
    const badgeClasses =
        RACE_STATUS_BADGE_CLASSES[status] ?? "bg-slate-100 text-slate-600";

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badgeClasses}`}
        >
            {label}
        </span>
    );
}
