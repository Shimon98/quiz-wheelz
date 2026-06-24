import { forwardRef } from "react";
import { X } from "lucide-react";
import { cx } from "../../../utils/classNameUtils";

const CLOSE_BUTTON_CLASSES =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none";

const ModalCloseButton = forwardRef(function ModalCloseButton(
    {
        ariaLabel,
        disabled = false,
        className = "",
        iconSize = 20,
        ...props
    },
    ref,
) {
    return (
        <button
            ref={ref}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cx(CLOSE_BUTTON_CLASSES, className)}
            {...props}
        >
            <X size={iconSize} strokeWidth={2.5} aria-hidden="true" />
        </button>
    );
});

export default ModalCloseButton;