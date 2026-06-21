import { MAX_PLAYER_OPTIONS } from "../../config/createRaceFormConfig";
import { cx } from "../../../../utils/classNameUtils";
import {
    DASHBOARD_CHOICE_STYLES,
    DASHBOARD_TEXT_STYLES,
} from "../../styles/dashboardUiStyles";

export default function MaxPlayersSelector({
                                               value,
                                               error,
                                               content,
                                               onChange,
                                           }) {
    return (
        <fieldset>
            <legend className={cx(
                "flex w-full items-center justify-end gap-2",
                DASHBOARD_TEXT_STYLES.fieldLabel,
            )}>
                <span>{content.fields.maxPlayers}</span>
                <span aria-hidden="true">👥</span>
            </legend>

            <div
                dir="ltr"
                className={`${DASHBOARD_CHOICE_STYLES.segmentedGroup} grid-cols-7`}
            >
                {MAX_PLAYER_OPTIONS.map((option) => {
                    const isSelected = Number(value) === option;

                    return (
                        <label
                            key={option}
                            className={cx(
                                DASHBOARD_CHOICE_STYLES.segmentedOptionBase,
                                isSelected
                                    ? DASHBOARD_CHOICE_STYLES.segmentedOptionSelected
                                    : DASHBOARD_CHOICE_STYLES.segmentedOptionIdle,
                            )}
                        >
                            <input
                                type="radio"
                                name="maxPlayers"
                                value={option}
                                checked={isSelected}
                                onChange={onChange}
                                className="sr-only"
                            />
                            {option}
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