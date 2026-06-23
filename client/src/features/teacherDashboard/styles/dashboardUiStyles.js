export const CREATE_RACE_FORM_STYLES = {
    form: "mt-5 grid gap-4",
    fieldGrid: "grid gap-4 md:grid-cols-2",
    actions: "mt-1 flex items-center justify-between gap-3",
    cancelButton: "min-w-36",
    submitButton: "inline-flex min-w-60 items-center justify-center gap-2",
    submitIcon: "h-5 w-5 shrink-0",
};

export const DASHBOARD_SURFACE_STYLES = {
    card:
        "rounded-3xl border border-white/80 bg-white shadow-[0_10px_28px_rgba(27,42,65,0.08)]",

    softCard:
        "rounded-2xl border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
};

export const TEACHER_DASHBOARD_MAIN_STYLES = {
    wrapper:
        "flex h-full min-h-0 flex-col gap-3 overflow-hidden",
};

export const TEACHER_DASHBOARD_LAYOUT_STYLES = {
    page:
        "relative h-screen overflow-hidden bg-sky-100 p-3 md:p-4",

    background:
        "absolute inset-0 opacity-40",

    content:
        "relative z-10 mx-auto flex h-full max-w-[1320px] min-h-0 gap-4",

    main:
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
};

export const TEACHER_DASHBOARD_PANEL_STYLES = {
    wrapper:
        "min-h-0 flex-1",

    racesPanel:
        "flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-white/80 p-5 text-start shadow-md",

    racesContent:
        "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden",

    racePreviewViewport:
        "min-h-0 flex-1 overflow-hidden",

    raceList:
        "grid content-start gap-3 pe-1",
};

export const TEACHER_STATS_GRID_STYLES = {
    wrapper:
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
};

export const TEACHER_STAT_CARD_STYLES = {
    card:
        "group relative min-h-[104px] overflow-hidden border border-white/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)]",

    content:
        "relative z-10 flex h-full items-start justify-between gap-3",

    textBlock:
        "min-w-0",

    label:
        "text-sm font-extrabold text-slate-500",

    value:
        "mt-2 text-3xl font-black leading-none",

    iconBox:
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_22px_rgba(15,23,42,0.12)]",

    icon:
        "h-6 w-6",

    decorativeBlob:
        "pointer-events-none absolute -bottom-10 -end-8 h-28 w-28 rounded-full blur-2xl transition duration-200 group-hover:scale-110",

    sparkline:
        "pointer-events-none absolute bottom-3 end-4 h-8 w-20 opacity-70",
};

export const TEACHER_STAT_CARD_TONE_STYLES = {
    sky: {
        card:
            "bg-gradient-to-br from-white via-sky-50 to-white",
        iconBox:
            "bg-sky-500 text-white",
        value:
            "text-sky-700",
        decorativeBlob:
            "bg-sky-200/70",
        sparkline:
            "text-sky-300",
    },

    emerald: {
        card:
            "bg-gradient-to-br from-white via-emerald-50 to-white",
        iconBox:
            "bg-emerald-500 text-white",
        value:
            "text-emerald-700",
        decorativeBlob:
            "bg-emerald-200/70",
        sparkline:
            "text-emerald-300",
    },

    violet: {
        card:
            "bg-gradient-to-br from-white via-violet-50 to-white",
        iconBox:
            "bg-violet-500 text-white",
        value:
            "text-violet-700",
        decorativeBlob:
            "bg-violet-200/70",
        sparkline:
            "text-violet-300",
    },

    amber: {
        card:
            "bg-gradient-to-br from-white via-amber-50 to-white",
        iconBox:
            "bg-amber-400 text-white",
        value:
            "text-amber-700",
        decorativeBlob:
            "bg-amber-200/80",
        sparkline:
            "text-amber-300",
    },
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

    maxPlayersGrid:
        "grid-cols-7",

    maxPlayersIcon:
        "h-4 w-4 text-violet-700",
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
        "absolute end-5 top-5 z-30",

    header:
        "mx-auto max-w-xl",

    headerContent:
        "flex items-center justify-center gap-0",

    titleBlock:
        "text-center",

    heroImage:
        "hidden h-[132px] max-w-[200px] shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.18)] sm:block",

    error:
        "mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700",

    titleIcon:
        "h-8 w-8 text-slate-900",
};

export const RACE_LENGTH_CARD_STYLES = {
    grid: "mt-3 grid gap-3 md:grid-cols-3",
    content: "grid gap-1",
    icon: "mx-auto flex h-8 w-8 items-center justify-center rounded-xl",
    title: "text-base font-black",
    points: "text-sm font-extrabold text-slate-500",
    sectionIcon: "h-4 w-4 text-rose-500",
    optionIcon: "h-5 w-5",
};

export const TEACHER_RACES_PREVIEW_STYLES = {
    header:
        "flex shrink-0 flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between",

    titleGroup:
        "flex items-center gap-3",

    titleIcon:
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-slate-900",

    title:
        "text-2xl font-black text-slate-900",

    description:
        "mt-1 text-base font-semibold text-slate-500",

    filterButton:
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50",

    content:
        "mt-4",

    footer:
        "mt-3 flex shrink-0 justify-center border-t border-slate-100 pt-3",

    showAllButton:
        "inline-flex min-h-10 min-w-56 items-center justify-center gap-2 rounded-2xl",
};

export const RACE_CARD_COMPACT_STYLES = {
    card:
        "grid min-h-[76px] items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)] lg:grid-cols-[minmax(260px,1.35fr)_minmax(130px,0.75fr)_minmax(110px,0.65fr)_auto_auto]",

    identity:
        "flex min-w-0 items-center gap-3",

    iconBox:
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 [&>svg]:block",

    titleBlock:
        "min-w-0",

    titleRow:
        "flex min-w-0 items-center gap-2",

    title:
        "truncate text-base font-black text-slate-900",

    favoriteIcon:
        "h-4 w-4 shrink-0 text-amber-400",

    roomCodeRow:
        "mt-1 flex items-center gap-2 text-sm font-bold text-slate-500",

    roomCodeBadge:
        "rounded-full bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700",

    subject:
        "flex items-center gap-2 text-sm font-extrabold text-slate-600",

    subjectIcon:
        "h-5 w-5 text-sky-500",

    players:
        "flex items-center gap-2 text-sm font-extrabold text-slate-700",

    playersIcon:
        "h-5 w-5 text-slate-400",

    actions:
        "flex items-center justify-end gap-2 justify-self-end",

    openButton:
        "shrink-0 text-white [&>svg]:block",

    moreButton:
        "inline-flex h-11 w-11 shrink-0 cursor-pointer list-none items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 group-open:bg-slate-200 [&>svg]:block [&::-webkit-details-marker]:hidden",
};

export const ALL_RACES_MODAL_STYLES = {
    overlay:
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]",

    panel:
        "relative flex max-h-[86vh] w-full max-w-[920px] flex-col rounded-[2rem] bg-white p-6 text-start shadow-[0_24px_80px_rgba(15,23,42,0.28)]",

    header:
        "flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 pb-4",

    title:
        "text-2xl font-black text-slate-900",

    description:
        "mt-1 text-sm font-bold text-slate-500",

    closeButton:
        "shrink-0",

    list:
        "mt-4 grid min-h-0 gap-3 overflow-y-auto pe-1",
};