export const WAITING_ROOM_LAYOUT_STYLES = Object.freeze({
    panel:
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-white/82 p-4 text-start shadow-md xl:p-5",

    body:
        "min-h-0 flex-1 overflow-y-auto pe-1 pt-4",

    contentGrid:
        "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]",

    mainColumn:
        "grid min-w-0 content-start gap-4",

    sideColumn:
        "grid min-w-0 content-start gap-0 rounded-3xl border border-slate-100 bg-white p-4 text-start shadow-[0_6px_18px_rgba(15,23,42,0.05)]",
});

export const WAITING_ROOM_HEADER_STYLES = Object.freeze({
    wrapper:
        "flex shrink-0 flex-col gap-3 border-b border-slate-100 pb-3 text-start md:flex-row md:items-center md:justify-between",

    titleGroup:
        "flex min-w-0 flex-1 flex-col items-center gap-2 text-center md:flex-row md:text-start",

    titleIcon:
        "text-2xl text-slate-800",

    title:
        "truncate text-xl font-black text-slate-900 md:text-2xl",

    backButton:
        "min-h-10 gap-2 rounded-2xl px-4 text-sm",
});

export const WAITING_ROOM_CARD_STYLES = Object.freeze({
    joinPanel:
        "grid gap-4 border-b border-slate-100 pb-5",
});

export const WAITING_ROOM_TEXT_STYLES = Object.freeze({
    sectionTitle:
        "text-base font-extrabold text-slate-900",

    label:
        "text-xs font-bold text-slate-400",

    value:
        "mt-0.5 text-sm font-extrabold text-slate-800",

    muted:
        "text-sm font-bold text-slate-500",

    hint:
        "mt-3 text-xs font-bold text-slate-400",
});

export const WAITING_ROOM_CODE_STYLES = Object.freeze({
    wrapper:
        "grid items-center gap-5 rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-6 shadow-[0_12px_32px_rgba(2,132,199,0.12)] transition duration-200 hover:shadow-[0_18px_42px_rgba(2,132,199,0.20)] md:grid-cols-[minmax(0,1fr)_170px]",

    codeArea:
        "min-w-0 text-center md:text-start",

    codeLabel:
        "text-sm font-black text-sky-600",

    code:
        "mt-1 whitespace-nowrap text-5xl font-black leading-none tracking-[0.16em] text-blue-600 [text-shadow:0_6px_22px_rgba(37,99,235,0.40)] sm:text-6xl md:text-7xl",

    description:
        "mt-3 text-sm font-bold text-slate-500",

    qrBox:
        "flex aspect-square min-h-40 flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white text-center text-slate-400 shadow-inner",

    qrIcon:
        "text-slate-400",

    qrText:
        "mt-2 text-xs font-extrabold text-slate-500",
});

export const WAITING_ROOM_BUTTON_STYLES = Object.freeze({
    actionsGrid:
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_2fr]",

    secondaryAction:
        "min-h-11 gap-2 rounded-2xl px-4 text-sm",

    startRace:
        "gap-2",

    dangerAction:
        "min-h-11 gap-2 rounded-2xl border border-rose-100 bg-white px-4 text-sm text-rose-600 shadow-[0_8px_18px_rgba(225,29,72,0.08)] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50",

    sideAction:
        "min-h-11 w-full gap-2 rounded-2xl text-sm",

    icon:
        "shrink-0",

    confirmedIcon:
        "shrink-0 text-emerald-600",
});

export const WAITING_ROOM_INFO_STYLES = Object.freeze({
    grid:
        "grid gap-3 sm:grid-cols-3",

    card:
        "flex min-h-12 items-center gap-2.5 rounded-2xl border border-white/80 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.10)]",

    cardVariants:
        ["bg-gradient-to-br from-white via-sky-50 to-white", "bg-gradient-to-br from-white via-amber-50 to-white", "bg-gradient-to-br from-white via-emerald-50 to-white"],

    iconVariants:
        ["bg-sky-500 text-white", "bg-amber-400 text-white", "bg-emerald-500 text-white"],

    icon:
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-[0_8px_18px_rgba(15,23,42,0.12)]",

    iconSvg:
        "h-4 w-4",

    content:
        "min-w-0 text-start",
});

export const WAITING_ROOM_PARTICIPANT_STYLES = Object.freeze({
    panel:
        "grid gap-4 border-t border-slate-100 pt-5",

    grid:
        "grid grid-cols-4 gap-3",

    slot:
        "relative flex h-28 flex-col items-center justify-end overflow-hidden rounded-2xl border p-2.5 text-center shadow-[0_8px_18px_rgba(15,23,42,0.07)] transition-shadow duration-200 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)]",

    joined:
        "border-emerald-200 bg-gradient-to-b from-white to-emerald-50 shadow-[0_10px_22px_rgba(16,185,129,0.12)]",

    empty:
        "border-dashed border-slate-200 bg-slate-50/60 opacity-80",

    numberBadge:
        "absolute start-0 top-0 flex h-7 w-9 items-center justify-center rounded-ee-xl text-sm font-black text-white",

    joinedBadge:
        "absolute bottom-2 end-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow-md",

    avatar:
        "flex h-12 w-14 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-inner",

    placeholderAvatar:
        "flex h-12 w-14 items-center justify-center rounded-xl bg-slate-200 text-slate-400 shadow-inner",

    vehicleImage:
        "h-full w-full object-contain",

    vehiclePlaceholderIcon:
        "h-6 w-6",

    playerName:
        "mt-1 truncate text-xs font-black text-slate-800",

    emptyText:
        "mt-1 text-[11px] font-extrabold text-slate-400",
});

export const WAITING_ROOM_SIDE_PANEL_STYLES = Object.freeze({
    section:
        "grid gap-3",

    sectionDivider:
        "mt-4 grid gap-3 border-t border-slate-100 pt-4",

    list:
        "mt-3 grid gap-2.5",

    item:
        "flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.10)]",

    itemLeft:
        "flex items-center gap-3",

    itemIcon:
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",

    itemIconVariants:
        ["bg-violet-50 text-violet-600", "bg-amber-50 text-amber-600", "bg-sky-50 text-sky-600", "bg-rose-50 text-rose-600", "bg-emerald-50 text-emerald-600"],

    itemLabel:
        "text-sm font-extrabold text-slate-700",

    itemValue:
        "text-sm font-black text-slate-700",
});
