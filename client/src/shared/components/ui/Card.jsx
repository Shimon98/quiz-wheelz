import { cx } from "../../../utils/classNameUtils";

const CARD_VARIANT_CLASSES = Object.freeze({
    default:
        "rounded-3xl bg-white/80 shadow-[0_8px_24px_rgba(27,42,65,0.08)]",

    panel:
        "rounded-3xl border border-white/70 bg-white/70 shadow-[0_10px_30px_rgba(27,42,65,0.08)]",

    soft:
        "rounded-3xl border border-slate-100 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05)]",

    dashed:
        "rounded-3xl border border-dashed border-slate-300 bg-slate-50",
});

const CARD_PADDING_CLASSES = Object.freeze({
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
});

export default function Card({
                                 children,
                                 as: Component = "div",
                                 variant = "default",
                                 padding = "md",
                                 className = "",
                                 ...props
                             }) {
    const variantClasses =
        CARD_VARIANT_CLASSES[variant] ?? CARD_VARIANT_CLASSES.default;

    const paddingClasses =
        CARD_PADDING_CLASSES[padding] ?? CARD_PADDING_CLASSES.md;

    return (
        <Component
            className={cx(variantClasses, paddingClasses, className)}
            {...props}
        >
            {children}
        </Component>
    );
}