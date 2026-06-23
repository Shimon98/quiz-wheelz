import { FlaskConical, UsersRound } from "lucide-react";
import { cx } from "../../../../utils/classNameUtils";
import { getSubjectDisplayName } from "../../utils/subjectDisplayUtils";
import { RACE_CARD_COMPACT_STYLES } from "../../styles/dashboardUiStyles";

function formatPlayers(currentPlayers, maxPlayers) {
    return `${currentPlayers ?? 0}/${maxPlayers ?? 0}`;
}

export default function RaceCardMeta({
                                         race,
                                         language,
                                         toneStyles,
                                     }) {
    const subjectName = getSubjectDisplayName(race, language);

    return (
        <>
            <div
                className={cx(
                    RACE_CARD_COMPACT_STYLES.subject,
                    toneStyles.subject,
                )}
            >
                <FlaskConical
                    size={20}
                    aria-hidden="true"
                    className={cx(
                        RACE_CARD_COMPACT_STYLES.subjectIcon,
                        toneStyles.subjectIcon,
                    )}
                />
                <span>{subjectName}</span>
            </div>

            <div className={RACE_CARD_COMPACT_STYLES.players}>
                <UsersRound
                    size={20}
                    aria-hidden="true"
                    className={RACE_CARD_COMPACT_STYLES.playersIcon}
                />
                <span>{formatPlayers(race.currentPlayers, race.maxPlayers)}</span>
            </div>
        </>
    );
}