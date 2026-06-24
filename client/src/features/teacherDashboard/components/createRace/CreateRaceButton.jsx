import Button from "../../../../shared/components/ui/Button";
import { cx } from "../../../../utils/classNameUtils";
import { CREATE_RACE_BUTTON_STYLES } from "../../styles/dashboardUiStyles";
import RaceFlagIcon from "../ui/RaceFlagIcon";

export default function CreateRaceButton({
                                             children,
                                             className = "",
                                             ...props
                                         }) {
    return (
        <Button
            variant="cta"
            size="lg"
            className={cx(CREATE_RACE_BUTTON_STYLES.base, className)}
            {...props}
        >
            <RaceFlagIcon className={CREATE_RACE_BUTTON_STYLES.icon} />
            <span>{children}</span>
        </Button>
    );
}