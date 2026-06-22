import { cx } from "../../../utils/classNameUtils";

const EMPTY_STATE_STYLES = {
    container:
        "flex min-h-[180px] flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center",

    message:
        "max-w-md text-sm font-bold text-slate-500",

    actions:
        "mt-5",
};

export default function EmptyState({
                                       message,
                                       children,
                                       className = "",
                                       messageClassName = "",
                                       actionsClassName = "",
                                   }) {
    return (
        <div className={cx(EMPTY_STATE_STYLES.container, className)}>
            {message && (
                <p className={cx(EMPTY_STATE_STYLES.message, messageClassName)}>
                    {message}
                </p>
            )}

            {children && (
                <div className={cx(EMPTY_STATE_STYLES.actions, actionsClassName)}>
                    {children}
                </div>
            )}
        </div>
    );
}