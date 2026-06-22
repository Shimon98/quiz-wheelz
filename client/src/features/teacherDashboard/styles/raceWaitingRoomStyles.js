export const WAITING_ROOM_LAYOUT_STYLES = Object.freeze({
    page:
        "min-h-0 overflow-y-auto rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_10px_30px_rgba(27,42,65,0.08)] xl:p-5",

    contentGrid:
        "mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]",

    mainColumn:
        "grid min-w-0 content-start gap-5",

    sideColumn:
        "grid min-w-0 content-start gap-0 rounded-[24px] border border-white/80 bg-white/85 p-4 text-start shadow-[0_6px_18px_rgba(27,42,65,0.06)]",
});

export const WAITING_ROOM_HEADER_STYLES = Object.freeze({
    wrapper:
        "flex flex-col gap-3 border-b border-slate-100 pb-3 text-start md:flex-row md:items-center md:justify-between",

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
        "grid items-center gap-4 rounded-[22px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 md:grid-cols-[minmax(0,1fr)_130px]",

    codeArea:
        "min-w-0 text-center md:text-start",

    codeLabel:
        "text-sm font-black text-slate-700",

    code:
        "mt-1 truncate text-5xl font-black tracking-[0.12em] text-blue-700 drop-shadow-sm md:text-6xl",

    description:
        "mt-2 text-sm font-bold text-slate-500",

    qrBox:
        "flex aspect-square min-h-32 flex-col items-center justify-center rounded-[20px] border border-slate-200 bg-white text-center text-slate-400 shadow-inner",

    qrIcon:
        "text-slate-400",

    qrText:
        "mt-2 text-xs font-extrabold text-slate-500",
});

export const WAITING_ROOM_BUTTON_STYLES = Object.freeze({
    actionsGrid:
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_1.4fr]",

    secondaryAction:
        "min-h-11 gap-2 rounded-2xl px-4 text-sm",

    startRace:
        "min-h-12 gap-2 rounded-2xl !bg-gradient-to-b !from-lime-400 !to-green-600 px-4 !text-base !font-black !text-white shadow-[0_12px_24px_rgba(22,163,74,0.28)] hover:-translate-y-0.5 hover:shadow-lg disabled:!text-white disabled:opacity-80",

    dangerAction:
        "min-h-11 gap-2 rounded-2xl border border-rose-100 bg-white px-4 text-sm text-rose-600 shadow-[0_8px_18px_rgba(225,29,72,0.08)] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50",

    sideAction:
        "min-h-11 w-full gap-2 rounded-2xl text-sm",

    icon:
        "shrink-0",
});

export const WAITING_ROOM_INFO_STYLES = Object.freeze({
    grid:
        "grid gap-3 md:grid-cols-3",

    card:
        "flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_6px_16px_rgba(15,23,42,0.05)]",

    iconVariants:
        ["bg-sky-50 text-sky-600", "bg-amber-50 text-amber-600", "bg-emerald-50 text-emerald-600"],

    icon:
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",

    iconSvg:
        "h-5 w-5",

    content:
        "min-w-0 text-end",
});

export const WAITING_ROOM_PARTICIPANT_STYLES = Object.freeze({
    panel:
        "grid gap-4 border-t border-slate-100 pt-5",

    grid:
        "flex flex-wrap justify-center gap-3",

    slot:
        "relative flex min-h-[150px] basis-[190px] max-w-[210px] flex-1 flex-col items-center justify-end overflow-hidden rounded-[22px] border p-3 text-center shadow-[0_8px_18px_rgba(15,23,42,0.07)]",

    joined:
        "border-emerald-200 bg-gradient-to-b from-white to-emerald-50",

    empty:
        "border-slate-200 bg-gradient-to-b from-white to-slate-100 opacity-75",

    numberBadge:
        "absolute start-0 top-0 flex h-9 w-11 items-center justify-center rounded-ee-2xl text-base font-black text-white",

    joinedBadge:
        "absolute bottom-3 end-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white shadow-md",

    avatar:
        "flex h-16 w-20 items-center justify-center rounded-2xl bg-white/70 text-slate-500 shadow-inner",

    placeholderAvatar:
        "flex h-16 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-400 shadow-inner",

    vehicleImage:
        "h-full w-full object-contain",

    vehiclePlaceholderIcon:
        "h-8 w-8",

    playerName:
        "mt-2 text-sm font-black text-slate-800",

    emptyText:
        "mt-2 text-xs font-extrabold text-slate-400",
});

export const WAITING_ROOM_SIDE_PANEL_STYLES = Object.freeze({
    section:
        "grid gap-3",

    sectionDivider:
        "mt-4 grid gap-3 border-t border-slate-100 pt-4",

    list:
        "mt-3 grid gap-2.5",

    item:
        "flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.05)]",

    itemLeft:
        "flex items-center gap-3",

    itemIcon:
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600",

    itemLabel:
        "text-sm font-extrabold text-slate-700",

    itemValue:
        "text-sm font-black text-slate-700",
});
