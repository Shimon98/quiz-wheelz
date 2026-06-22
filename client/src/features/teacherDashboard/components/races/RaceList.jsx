import RaceCard from "./RaceCard";

export default function RaceList({
    races,
    content,
    onOpenRace,
    onEditRace,
    onCancelRace,
}) {
    return (
        <div className="grid gap-4 overflow-y-auto pe-1">
            {races.map((race) => (
                <RaceCard
                    key={race.raceId}
                    race={race}
                    content={content}
                    onOpenRace={onOpenRace}
                    onEditRace={onEditRace}
                    onCancelRace={onCancelRace}
                />
            ))}
        </div>
    );
}
