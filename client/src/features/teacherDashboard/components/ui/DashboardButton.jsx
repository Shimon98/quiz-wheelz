const VARIANT_CLASSES = {
    primary: "bg-sky-500 text-white shadow-md hover:bg-sky-600",
    secondary: "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    cta: "bg-gradient-to-l from-blue-700 via-sky-500 to-cyan-400 text-white shadow-[0_14px_28px_rgba(2,132,199,0.35)] hover:from-blue-800 hover:via-sky-600 hover:to-cyan-500",
};

const SIZE_CLASSES = {
    sm: "min-h-9 px-4 py-2 text-sm",
    md: "min-h-11 px-5 py-3 text-sm",
    lg: "min-h-12 px-8 py-3 text-base",
};

export default function DashboardButton({
    children,
    onClick,
    type = "button",
    variant = "primary",
    size = "md",
    disabled = false,
    className = "",
    ...props
}) {
    const variantClasses = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
    const sizeClasses = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-2xl font-extrabold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none ${variantClasses} ${sizeClasses} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
