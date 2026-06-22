import { forwardRef } from "react";
import { cx } from "../../../utils/classNameUtils";

const VARIANT_CLASSES = Object.freeze({
    primary: "bg-sky-500 text-white shadow-md hover:bg-sky-600",
    secondary:
        "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    cta:
        "bg-gradient-to-l from-blue-700 via-sky-500 to-cyan-400 text-white shadow-[0_14px_28px_rgba(2,132,199,0.35)] hover:from-blue-800 hover:via-sky-600 hover:to-cyan-500",
    successCta:
        "bg-gradient-to-l from-emerald-700 via-emerald-500 to-lime-400 text-white shadow-[0_14px_28px_rgba(5,150,105,0.32)] hover:from-emerald-800 hover:via-emerald-600 hover:to-lime-500",
});

const SIZE_CLASSES = Object.freeze({
    sm: "min-h-9 px-4 py-2 text-sm",
    md: "min-h-11 px-5 py-3 text-sm",
    lg: "min-h-12 px-8 py-3 text-lg",
});

const BASE_CLASSES =
    "rounded-2xl font-extrabold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:active:scale-100";

const DashboardButton = forwardRef(function DashboardButton(
    {
        children,
        type = "button",
        variant = "primary",
        size = "md",
        disabled = false,
        className = "",
        ...props
    },
    ref,
) {
    const variantClasses = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
    const sizeClasses = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled}
            className={cx(BASE_CLASSES, variantClasses, sizeClasses, className)}
            {...props}
        >
            {children}
        </button>
    );
});

export default DashboardButton;