import RaceCardActions from "./RaceCardActions";
import RaceCardHeader from "./RaceCardHeader";
import RaceCardMeta from "./RaceCardMeta";
import { cx } from "../../../../utils/classNameUtils";
import {
    RACE_CARD_COMPACT_STYLES,
    RACE_CARD_STATUS_TONE_STYLES,
} from "../../styles/dashboardUiStyles";
import { getRaceStatusTone } from "../../utils/raceStatusUtils";

const DEFAULT_RACE_CARD_TONE = "slate";

export default function RaceCard({
                                     race,
                                     content,
                                     language,
                                     direction,
                                     onOpenRace,
                                     onEditRace,
                                     onCancelRace,
                                     actionPresentation = "icon",
                                 }) {
    if (!race) {
        return null;
    }

    const tone = getRaceStatusTone(race.status);
    const toneStyles =
        RACE_CARD_STATUS_TONE_STYLES[tone] ??
        RACE_CARD_STATUS_TONE_STYLES[DEFAULT_RACE_CARD_TONE];

    return (
        <article
            className={cx(RACE_CARD_COMPACT_STYLES.card, toneStyles.card)}
            dir={direction}
        >
            <RaceCardHeader
                race={race}
                roomCodeLabel={content.meta.roomCode}
                toneStyles={toneStyles}
            />

            <RaceCardMeta
                race={race}
                language={language}
                toneStyles={toneStyles}
            />

            <RaceCardActions
                race={race}
                content={content.actions}
                statusLabels={content.statusLabels}
                toneStyles={toneStyles}
                onOpenRace={onOpenRace}
                onEditRace={onEditRace}
                onCancelRace={onCancelRace}
                actionPresentation={actionPresentation}
            />
        </article>
    );
}
