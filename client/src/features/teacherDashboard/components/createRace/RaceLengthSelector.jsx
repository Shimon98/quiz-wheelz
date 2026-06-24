import {Timer, Trophy} from "lucide-react";
import {RACE_LENGTH_OPTIONS} from "../../config/createRaceFormConfig";
import {
    DASHBOARD_CHOICE_STYLES,
    DASHBOARD_TEXT_STYLES,
    RACE_LENGTH_CARD_STYLES,
    RACE_LENGTH_OPTION_STYLES,
} from "../../styles/dashboardUiStyles";
import {cx} from "../../../../utils/classNameUtils";
import RaceFlagIcon from "../ui/RaceFlagIcon";

const RACE_LENGTH_ICONS = {
    short: Timer,
    regular: Trophy,
    long: RaceFlagIcon,
};

function formatPoints(totalDistance, pointsTemplate) {
    return pointsTemplate.replace("{value}", totalDistance);
}

export default function RaceLengthSelector({
                                               value,
                                               error,
                                               content,
                                               onChange,
                                           }) {
    return (
        <fieldset dir="rtl">
            <legend className={DASHBOARD_TEXT_STYLES.sectionLabel}>
                <RaceFlagIcon className={RACE_LENGTH_CARD_STYLES.sectionIcon}/>
                <span>{content.fields.raceLength}</span>
            </legend>

            <div className={RACE_LENGTH_CARD_STYLES.grid}>
                {RACE_LENGTH_OPTIONS.map((option) => {
                    const isSelected = Number(value) === option.totalDistance;

                    const optionStyle =
                        RACE_LENGTH_OPTION_STYLES[option.key] ??
                        RACE_LENGTH_OPTION_STYLES.regular;

                    const IconComponent =
                        RACE_LENGTH_ICONS[option.key] ?? Trophy;

                    return (
                        <label
                            key={option.key}
                            className={cx(
                                DASHBOARD_CHOICE_STYLES.optionCardBase,
                                isSelected
                                    ? optionStyle.selected
                                    : DASHBOARD_CHOICE_STYLES.optionCardIdle,
                            )}
                        >
                            <input
                                type="radio"
                                name="totalDistance"
                                value={option.totalDistance}
                                checked={isSelected}
                                onChange={onChange}
                                className="sr-only"
                            />

                            {isSelected && (
                                <span className={DASHBOARD_CHOICE_STYLES.selectedCheck}>
                                    ✓
                                </span>
                            )}

                            <span className={RACE_LENGTH_CARD_STYLES.content}>
                                <span
                                    className={cx(
                                        RACE_LENGTH_CARD_STYLES.icon,
                                        optionStyle.iconBg,
                                    )}
                                    aria-hidden="true"
                                >
                                    <IconComponent
                                        className={cx(
                                            RACE_LENGTH_CARD_STYLES.optionIcon,
                                            optionStyle.iconColor,
                                        )}
                                        strokeWidth={2.5}
                                    />
                                </span>

                                <span
                                    className={cx(
                                        RACE_LENGTH_CARD_STYLES.title,
                                        isSelected
                                            ? optionStyle.text
                                            : "text-slate-800",
                                    )}
                                >
                                    {content.raceLengths[option.contentKey]}
                                </span>

                                <span className={RACE_LENGTH_CARD_STYLES.points}>
                                    {formatPoints(
                                        option.totalDistance,
                                        content.raceLengths.points,
                                    )}
                                </span>
                            </span>
                        </label>
                    );
                })}
            </div>

            <p className={DASHBOARD_TEXT_STYLES.helperError}>
                {error || "\u00A0"}
            </p>
        </fieldset>
    );
}