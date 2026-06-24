import { cx } from "../../../utils/classNameUtils";

const ERROR_STATE_STYLES = {
    container:
        "flex min-h-[180px] flex-1 items-center justify-center rounded-3xl bg-rose-50 p-6 text-center text-sm font-bold text-rose-700",
};

export default function ErrorState({
                                       message,
                                       className = "",
                                   }) {
    if (!message) {
        return null;
    }

    return (
        <div className={cx(ERROR_STATE_STYLES.container, className)}>
            {message}
        </div>
    );
}