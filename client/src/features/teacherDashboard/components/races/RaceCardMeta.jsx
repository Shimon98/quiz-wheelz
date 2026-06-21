import { formatDateTime } from "../../utils/dateFormatUtils";

function RaceMetaItem({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="text-xs font-bold text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-extrabold text-slate-800">{value}</dd>
        </div>
    );
}

function formatDistance(totalDistance, distancePointsLabel) {
    const value = totalDistance ?? 0;

    return distancePointsLabel.replace("{value}", value);
}

export default function RaceCardMeta({ race, content }) {
    return (
        <dl className="grid grid-cols-2 gap-3 text-start md:grid-cols-4">
            <RaceMetaItem label={content.roomCode} value={race.roomCode ?? "-"} />
            <RaceMetaItem
                label={content.players}
                value={`${race.currentPlayers ?? 0}/${race.maxPlayers ?? 0}`}
            />
            <RaceMetaItem
                label={content.distance}
                value={formatDistance(race.totalDistance, content.distancePoints)}
            />
            <RaceMetaItem
                label={content.created}
                value={formatDateTime(race.createdAt, content.notScheduled)}
            />
        </dl>
    );
}
