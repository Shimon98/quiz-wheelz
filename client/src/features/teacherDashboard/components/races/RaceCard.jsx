import RaceCardActions from "./RaceCardActions";
import RaceCardHeader from "./RaceCardHeader";
import RaceCardMeta from "./RaceCardMeta";

export default function RaceCard({
    race,
    content,
    onOpenRace,
    onEditRace,
    onCancelRace,
}) {
    if (!race) {
        return null;
    }

    return (
        <article
            className="flex flex-col gap-5 rounded-3xl border border-white/80 bg-white p-5 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]"
            dir="auto"
        >
            <RaceCardHeader race={race} statusLabels={content.statusLabels} />
            <RaceCardMeta race={race} content={content.meta} />
            <RaceCardActions
                race={race}
                content={content.actions}
                onOpenRace={onOpenRace}
                onEditRace={onEditRace}
                onCancelRace={onCancelRace}
            />
        </article>
    );
}
