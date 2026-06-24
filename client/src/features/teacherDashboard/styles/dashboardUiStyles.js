export const CREATE_RACE_FORM_STYLES = {
    form: "flex h-full min-h-0 flex-col",
    fieldsScroll: "mt-5 grid min-h-0 flex-1 gap-4 overflow-y-auto pe-1",
    fieldGrid: "grid gap-4 md:grid-cols-2",
    actions: "mt-4 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-4",
    cancelButton: "min-w-36",
    submitButton: "inline-flex min-w-60 items-center justify-center gap-2",
    submitIcon: "h-5 w-5 shrink-0",
};

export const CREATE_RACE_BUTTON_STYLES = {
    base:
        "inline-flex items-center justify-center gap-2",

    icon:
        "h-5 w-5 shrink-0",
};

export const DASHBOARD_SURFACE_STYLES = {
    card:
        "rounded-3xl border border-white/80 bg-white shadow-[0_10px_28px_rgba(27,42,65,0.08)]",

    softCard:
        "rounded-2xl border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
};

export const TEACHER_DASHBOARD_MAIN_STYLES = {
    wrapper:
        "flex min-h-full flex-col gap-3",
};

export const TEACHER_DASHBOARD_LAYOUT_STYLES = {
    page:
        "relative h-dvh overflow-hidden bg-sky-100 p-3 md:p-4",

    background:
        "absolute inset-0 opacity-40",

    content:
        "relative z-10 mx-auto flex h-full max-w-[1320px] min-h-0 gap-4",

    main:
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden max-lg:[scrollbar-gutter:stable]",
};

export const TEACHER_DASHBOARD_PANEL_STYLES = {
    // Below lg the panel sizes to its content and the page scrolls; at lg+ it fills the
    // column as an app-shell and the preview list scrolls internally (see racesContent).
    wrapper:
        "min-h-0 lg:flex-1",

    racesPanel:
        "flex flex-col overflow-hidden rounded-3xl bg-white/82 p-4 text-start shadow-md lg:h-full lg:min-h-0",

    racesContent:
        "mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto lg:pe-1",

    raceList:
        "grid content-start gap-3",
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
        "flex items-center justify-center gap-2 text-2xl font-black leading-tight text-slate-900 sm:gap-3 sm:text-4xl",

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
        "relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-[2rem] bg-white px-5 py-5 text-start shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:px-7 sm:py-6",

    closeButton:
        "absolute end-5 top-5 z-30",

    header:
        "mx-auto max-w-xl shrink-0",

    headerContent:
        "flex items-center justify-center gap-0",

    titleBlock:
        "text-center",

    heroImage:
        "hidden h-[132px] max-w-[200px] shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.18)] sm:block",

    error:
        "mt-5 shrink-0 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700",

    formWrapper:
        "min-h-0 flex-1",

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
        "mt-3 flex min-h-14 shrink-0 items-center justify-center border-t border-slate-100 pt-2",

    showAllButton:
        "inline-flex min-h-10 min-w-52 items-center justify-center gap-2 rounded-2xl bg-white text-sm shadow-sm ring-1 ring-slate-200 hover:bg-slate-50",

    createRaceButton:
        "min-w-44 shadow-[0_14px_28px_rgba(2,132,199,0.28)]",
};

export const RACE_CARD_COMPACT_STYLES = {
    card:
        "relative grid min-h-[76px] items-center gap-4 overflow-hidden rounded-[1.25rem] border border-slate-100 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.055)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-100 hover:shadow-[0_14px_28px_rgba(15,23,42,0.10)] lg:grid-cols-[minmax(260px,1.45fr)_minmax(150px,0.75fr)_minmax(120px,0.65fr)_auto_auto]",

    identity:
        "relative z-10 flex min-w-0 items-center gap-3",

    iconBox:
        "relative flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_8px_18px_rgba(15,23,42,0.08)]",

    icon:
        "h-5 w-5",

    titleBlock:
        "min-w-0",

    titleRow:
        "flex min-w-0 items-center gap-2",

    title:
        "truncate text-base font-black text-slate-900",

    roomCodeRow:
        "mt-1 flex min-h-6 items-center gap-2 text-sm font-bold text-slate-500",

    roomCodeLabel:
        "text-xs font-black text-slate-400",

    roomCodeBadge:
        "rounded-full bg-white px-3 py-1 text-xs font-black shadow-[0_4px_12px_rgba(15,23,42,0.06)] ring-1",

    subject:
        "inline-flex min-h-9 items-center gap-2 rounded-2xl px-3 text-sm font-extrabold ring-1",

    subjectIcon:
        "h-5 w-5",

    players:
        "inline-flex min-h-9 items-center gap-2 rounded-2xl bg-slate-50 px-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-100",

    playersIcon:
        "h-5 w-5 text-slate-400",

    actions:
        "flex items-center justify-end gap-2 justify-self-end",

    actionsExpanded:
        "w-full justify-between lg:w-auto lg:justify-end",

    openButton:
        "h-12 min-h-12 w-12 shrink-0 rounded-2xl p-0 [&>svg]:block",

    openButtonExpanded:
        "h-11 min-h-11 flex-1 justify-center gap-2 rounded-2xl px-4 text-sm font-black sm:min-w-44 sm:flex-none lg:h-12 lg:min-h-12 lg:w-12 lg:min-w-0 lg:px-0",

    openButtonLabel:
        "lg:sr-only",

    openIcon:
        "h-5 w-5",

    moreButton:
        "inline-flex h-10 w-10 shrink-0 cursor-pointer list-none items-center justify-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-100 transition hover:bg-slate-100 group-open:bg-slate-100 [&>svg]:block [&::-webkit-details-marker]:hidden",
};

export const RACE_CARD_STATUS_TONE_STYLES = {
    amber: {
        card:
            "",
        iconBox:
            "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
        roomCodeBadge:
            "text-amber-700 ring-amber-100",
        subject:
            "bg-amber-50 text-amber-700 ring-amber-100",
        subjectIcon:
            "text-amber-500",
        actionButton:
            "bg-amber-400 text-white shadow-[0_12px_24px_rgba(245,158,11,0.28)] hover:bg-amber-500",
        actionIcon:
            "text-white",
    },

    emerald: {
        card:
            "",
        iconBox:
            "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
        roomCodeBadge:
            "text-emerald-700 ring-emerald-100",
        subject:
            "bg-emerald-50 text-emerald-700 ring-emerald-100",
        subjectIcon:
            "text-emerald-500",
        actionButton:
            "bg-emerald-500 text-white shadow-[0_12px_24px_rgba(16,185,129,0.26)] hover:bg-emerald-600",
        actionIcon:
            "text-white",
    },

    green: {
        card:
            "",
        iconBox:
            "bg-green-50 text-green-600 ring-1 ring-green-100",
        roomCodeBadge:
            "text-green-700 ring-green-100",
        subject:
            "bg-green-50 text-green-700 ring-green-100",
        subjectIcon:
            "text-green-500",
        actionButton:
            "bg-green-500 text-white shadow-[0_12px_24px_rgba(34,197,94,0.26)] hover:bg-green-600",
        actionIcon:
            "text-white",
    },

    violet: {
        card:
            "",
        iconBox:
            "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
        roomCodeBadge:
            "text-violet-700 ring-violet-100",
        subject:
            "bg-violet-50 text-violet-700 ring-violet-100",
        subjectIcon:
            "text-violet-500",
        actionButton:
            "bg-violet-500 text-white shadow-[0_12px_24px_rgba(139,92,246,0.26)] hover:bg-violet-600",
        actionIcon:
            "text-white",
    },

    rose: {
        card:
            "",
        iconBox:
            "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
        roomCodeBadge:
            "text-rose-700 ring-rose-100",
        subject:
            "bg-rose-50 text-rose-700 ring-rose-100",
        subjectIcon:
            "text-rose-500",
        actionButton:
            "bg-rose-100 text-rose-500 ring-1 ring-rose-200 shadow-none",
        actionIcon:
            "text-rose-500",
    },

    slate: {
        card:
            "",
        iconBox:
            "bg-slate-50 text-slate-500 ring-1 ring-slate-100",
        roomCodeBadge:
            "text-slate-700 ring-slate-100",
        subject:
            "bg-slate-50 text-slate-700 ring-slate-100",
        subjectIcon:
            "text-slate-500",
        actionButton:
            "bg-slate-100 text-slate-500 ring-1 ring-slate-200 shadow-none hover:bg-slate-200",
        actionIcon:
            "text-slate-500",
    },
};

export const ALL_RACES_MODAL_STYLES = {
    overlay:
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]",

    panel:
        "relative flex max-h-[86dvh] w-full max-w-[920px] flex-col overflow-hidden rounded-[2rem] bg-white p-6 text-start shadow-[0_24px_80px_rgba(15,23,42,0.28)]",

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

export const TEACHER_SIDEBAR_STYLES = Object.freeze({
    aside:
        "hidden h-full min-h-0 w-64 flex-none flex-col gap-3 overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_10px_30px_rgba(27,42,65,0.10)] backdrop-blur-sm lg:flex",

    navRegion:
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pe-1",

    navGroup:
        "flex flex-col gap-1.5",

    ctaWrapper:
        "py-1",

    cta:
        "w-full",

    divider:
        "my-1 border-t border-slate-100",
});

export const SIDEBAR_NAV_ITEM_STYLES = Object.freeze({
    base:
        "group relative flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-start text-[15px] font-bold transition disabled:cursor-not-allowed",

    active:
        "bg-sky-50 text-sky-700",

    idle:
        "text-slate-700 hover:bg-sky-50",

    comingSoon:
        "text-slate-400",

    indicator:
        "absolute inset-y-2 start-0 w-1 rounded-full bg-sky-500",

    content:
        "flex min-w-0 items-center gap-3",

    iconTile:
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",

    iconTileActive:
        "bg-sky-500 text-white shadow-[0_8px_16px_rgba(14,165,233,0.34)]",

    iconTileIdle:
        "bg-sky-50 text-sky-600 group-hover:bg-sky-100",

    iconTileRacing:
        "bg-amber-50 text-amber-600 group-hover:bg-amber-100",

    iconTileComingSoon:
        "bg-slate-100 text-slate-400",

    icon:
        "h-5 w-5",

    label:
        "truncate",

    comingSoonBadge:
        "bg-slate-100 text-slate-400",
});

export const TEACHER_MOBILE_NAV_STYLES = Object.freeze({
    topBar:
        "z-20 mb-2 flex min-h-[60px] items-center gap-2 rounded-[1.15rem] border border-white/75 bg-white/82 px-2.5 py-1.5 shadow-[0_6px_16px_rgba(15,23,42,0.07)] backdrop-blur-md lg:hidden",

    topBarBrand:
        "flex min-w-0 flex-1 items-center justify-center",

    topBarLogo:
        "h-7 w-auto max-w-[150px] object-contain",

    topBarBrandText:
        "truncate text-base font-extrabold text-sky-700",

    topBarSpacer:
        "h-11 w-11 shrink-0",

    triggerButton:
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-sky-50 active:scale-[0.97]",

    triggerIcon:
        "h-6 w-6 stroke-[2.35]",

    drawerOverlay:
        "!items-stretch !justify-start !p-0",

    drawerPanel:
        "flex h-dvh w-[280px] max-w-[82vw] flex-col gap-3 overflow-hidden rounded-e-3xl border border-white/70 p-4",

    drawerClose:
        "absolute end-4 top-4 z-10",
});

export const SIDEBAR_USER_CARD_STYLES = Object.freeze({
    wrapper:
        "shrink-0 border-t border-slate-100 pt-3",

    card:
        "flex items-center gap-3 rounded-2xl border border-white/70 bg-sky-50/70 px-3 py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.05)]",

    avatar:
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-black text-white shadow-[0_6px_14px_rgba(14,165,233,0.30)]",

    avatarIcon:
        "h-5 w-5",

    textBlock:
        "min-w-0",

    name:
        "truncate text-sm font-black text-slate-800",

    role:
        "truncate text-xs font-bold text-slate-400",

    logoutButton:
        "mt-2 w-full gap-2",

    logoutIcon:
        "h-4 w-4 shrink-0",
});
