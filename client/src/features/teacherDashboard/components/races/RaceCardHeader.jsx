import { Flag, Star } from "lucide-react";
import { getSubjectDisplayName } from "../../utils/subjectDisplayUtils";
import { RACE_CARD_COMPACT_STYLES } from "../../styles/dashboardUiStyles";

export default function RaceCardHeader({ race, language }) {
    const subjectName = getSubjectDisplayName(race, language);

    return (
        <div className={RACE_CARD_COMPACT_STYLES.identity}>
            <span className={RACE_CARD_COMPACT_STYLES.iconBox}>
                <Flag size={24} aria-hidden="true" />
            </span>

            <div className={RACE_CARD_COMPACT_STYLES.titleBlock}>
                <div className={RACE_CARD_COMPACT_STYLES.titleRow}>
                    <h3 className={RACE_CARD_COMPACT_STYLES.title}>
                        {race.title}
                    </h3>

                    <Star
                        size={16}
                        aria-hidden="true"
                        className={RACE_CARD_COMPACT_STYLES.favoriteIcon}
                    />
                </div>

                <p className={RACE_CARD_COMPACT_STYLES.roomCodeRow}>
                    <span>{subjectName}</span>

                    {race.roomCode && (
                        <span className={RACE_CARD_COMPACT_STYLES.roomCodeBadge}>
                            {race.roomCode}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}