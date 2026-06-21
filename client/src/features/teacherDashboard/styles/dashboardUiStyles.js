export const CREATE_RACE_FORM_STYLES = {
    form: "mt-5 grid gap-4",
    fieldGrid: "grid gap-4 md:grid-cols-2",
    actions: "mt-1 flex items-center justify-between gap-3",
};

export const DASHBOARD_SURFACE_STYLES = {
    card:
        "rounded-3xl border border-white/80 bg-white shadow-[0_10px_28px_rgba(27,42,65,0.08)]",

    softCard:
        "rounded-2xl border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
};

export const DASHBOARD_TEXT_STYLES = {
    modalTitle:
        "flex items-center justify-center gap-3 text-4xl font-black leading-tight text-slate-900",

    modalDescription:
        "mt-1 text-base font-semibold text-slate-500",

    fieldLabel:
        "text-base font-black text-slate-800",

    sectionLabel:
        "flex w-full items-center justify-start gap-2 text-right text-base font-black text-slate-800",

    helperError:
        "mt-2 min-h-5 text-sm font-bold text-rose-600",

    muted:
        "mt-2 text-sm font-bold text-slate-500",
};

export const DASHBOARD_FIELD_STYLES = {
    input:
        "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100",

    select:
        "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.06)] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
};

export const DASHBOARD_CHOICE_STYLES = {
    segmentedGroup:
        "mt-3 grid overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.08)]",

    segmentedOptionBase:
        "flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-base font-black transition",

    segmentedOptionSelected:
        "bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.35)]",

    segmentedOptionIdle:
        "text-slate-700 hover:bg-sky-50",

    optionCardBase:
        "relative flex min-h-20 cursor-pointer items-center justify-center rounded-2xl border bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",

    optionCardIdle:
        "border-slate-200 text-slate-700 hover:bg-slate-50",

    selectedCheck:
        "absolute -top-3 right-1/2 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-white shadow-md",
};

export const RACE_LENGTH_OPTION_STYLES = {
    short: {
        selected: "border-emerald-400 bg-emerald-50 text-emerald-700",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        text: "text-emerald-700",
    },

    regular: {
        selected: "border-sky-500 bg-sky-50 text-sky-700",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
        text: "text-sky-700",
    },

    long: {
        selected: "border-violet-400 bg-violet-50 text-violet-700",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        text: "text-violet-700",
    },
};

export const DASHBOARD_MODAL_STYLES = {
    overlay:
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]",

    panel:
        "relative w-full max-w-[640px] overflow-visible rounded-[2rem] bg-white px-7 py-6 text-start shadow-[0_24px_80px_rgba(15,23,42,0.28)]",
    closeButton:
        "absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl p-0 text-2xl leading-none",

    header:
        "relative mx-auto max-w-xl pt-4 text-center",

    heroImage:
        "absolute left-0 top-0 hidden h-[85px] w-auto object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.18)] sm:block",

    heroIcon:
        "mb-1 text-5xl leading-none",

    error:
        "mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700",
};

export const RACE_LENGTH_CARD_STYLES = {
    grid: "mt-3 grid gap-3 md:grid-cols-3",
    content: "grid gap-1",
    icon: "mx-auto flex h-8 w-8 items-center justify-center rounded-xl",
    title: "text-base font-black",
    points: "text-sm font-extrabold text-slate-500",
};