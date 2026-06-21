import { RACE_LENGTH_OPTIONS } from "../../config/createRaceFormConfig";
import {
    DASHBOARD_CHOICE_STYLES,
    DASHBOARD_TEXT_STYLES,
    RACE_LENGTH_CARD_STYLES,
    RACE_LENGTH_OPTION_STYLES,
} from "../../styles/dashboardUiStyles";
import { cx } from "../../../../utils/classNameUtils";

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
        <fieldset>
            <legend
                className={cx(
                    "flex w-full items-center justify-end gap-2",
                    DASHBOARD_TEXT_STYLES.fieldLabel,
                )}
            >
                <span>{content.fields.raceLength}</span>
                <span aria-hidden="true">🚩</span>
            </legend>

            <div className={RACE_LENGTH_CARD_STYLES.grid}>
                {RACE_LENGTH_OPTIONS.map((option) => {
                    const isSelected = Number(value) === option.totalDistance;
                    const optionStyle =
                        RACE_LENGTH_OPTION_STYLES[option.key] ??
                        RACE_LENGTH_OPTION_STYLES.regular;

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
                                    className={cx(RACE_LENGTH_CARD_STYLES.icon, optionStyle.iconBg)}
                                    aria-hidden="true"
                                >
                                    {optionStyle.icon}
                                </span>

                                <span
                                    className={cx(
                                        RACE_LENGTH_CARD_STYLES.title,
                                        isSelected ? optionStyle.text : "text-slate-800",
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