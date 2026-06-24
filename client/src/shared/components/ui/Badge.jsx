import { cx } from "../../../utils/classNameUtils";

const BADGE_VARIANT_CLASSES = Object.freeze({
    neutral: "bg-slate-100 text-slate-600",
    info: "bg-sky-100 text-sky-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
});

const BADGE_SIZE_CLASSES = Object.freeze({
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
});

const BASE_CLASSES =
    "inline-flex items-center justify-center rounded-full font-bold";

export default function Badge({
                                  children,
                                  variant = "neutral",
                                  size = "md",
                                  className = "",
                              }) {
    const variantClasses =
        BADGE_VARIANT_CLASSES[variant] ?? BADGE_VARIANT_CLASSES.neutral;

    const sizeClasses =
        BADGE_SIZE_CLASSES[size] ?? BADGE_SIZE_CLASSES.md;

    return (
        <span className={cx(BASE_CLASSES, variantClasses, sizeClasses, className)}>
            {children}
        </span>
    );
}