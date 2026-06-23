import { cx } from "../../../../utils/classNameUtils";
import { RACE_CARD_COMPACT_STYLES } from "../../styles/dashboardUiStyles";
import RaceFlagIcon from "../ui/RaceFlagIcon";

export default function RaceCardHeader({
                                           race,
                                           roomCodeLabel,
                                           toneStyles,
                                       }) {
    return (
        <div className={RACE_CARD_COMPACT_STYLES.identity}>
            <span
                className={cx(
                    RACE_CARD_COMPACT_STYLES.iconBox,
                    toneStyles.iconBox,
                )}
            >
                <RaceFlagIcon className={RACE_CARD_COMPACT_STYLES.icon} />
            </span>

            <div className={RACE_CARD_COMPACT_STYLES.titleBlock}>
                <div className={RACE_CARD_COMPACT_STYLES.titleRow}>
                    <h3 className={RACE_CARD_COMPACT_STYLES.title}>
                        {race.title}
                    </h3>
                </div>

                {race.roomCode && (
                    <p className={RACE_CARD_COMPACT_STYLES.roomCodeRow}>
                        <span className={RACE_CARD_COMPACT_STYLES.roomCodeLabel}>
                            {roomCodeLabel}:
                        </span>

                        <span
                            className={cx(
                                RACE_CARD_COMPACT_STYLES.roomCodeBadge,
                                toneStyles.roomCodeBadge,
                            )}
                        >
                            {race.roomCode}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}