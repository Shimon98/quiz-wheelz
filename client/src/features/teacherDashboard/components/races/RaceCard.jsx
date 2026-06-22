import RaceCardActions from "./RaceCardActions";
import RaceCardHeader from "./RaceCardHeader";
import RaceCardMeta from "./RaceCardMeta";
import { RACE_CARD_COMPACT_STYLES } from "../../styles/dashboardUiStyles";

export default function RaceCard({
                                     race,
                                     content,
                                     language,
                                     direction,
                                     onOpenRace,
                                     onEditRace,
                                     onCancelRace,
                                 }) {
    if (!race) {
        return null;
    }

    return (
        <article className={RACE_CARD_COMPACT_STYLES.card} dir={direction}>
            <RaceCardHeader race={race} language={language} />

            <RaceCardMeta race={race} language={language} />

            <RaceCardActions
                race={race}
                content={content.actions}
                statusLabels={content.statusLabels}
                onOpenRace={onOpenRace}
                onEditRace={onEditRace}
                onCancelRace={onCancelRace}
            />
        </article>
    );
}