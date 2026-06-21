export const WAITING_ROOM_LAYOUT_STYLES = Object.freeze({
    page:
        "min-h-0 overflow-y-auto rounded-3xl bg-white/35 p-5",

    contentGrid:
        "grid min-h-0 gap-5 xl:grid-cols-[1fr_360px]",

    mainColumn:
        "grid min-h-0 gap-5",

    sideColumn:
        "grid content-start gap-5",
});

export const WAITING_ROOM_HEADER_STYLES = Object.freeze({
    wrapper:
        "flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/85 px-5 py-4 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)] md:flex-row md:items-center md:justify-between",

    titleGroup:
        "flex min-w-0 flex-1 flex-col items-center gap-3 text-center md:flex-row md:text-start",

    titleIcon:
        "text-3xl",

    title:
        "truncate text-2xl font-black text-slate-900 md:text-3xl",

    backButton:
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 text-sm font-extrabold text-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.08)] transition hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-md",
});

export const WAITING_ROOM_CARD_STYLES = Object.freeze({
    panel:
        "rounded-3xl border border-white/80 bg-white/90 p-6 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]",

    joinPanel:
        "rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-[0_14px_34px_rgba(14,165,233,0.12)]",

    joinPanelContent:
        "grid gap-5",

    softCard:
        "rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
});



export const WAITING_ROOM_TEXT_STYLES = Object.freeze({
    sectionTitle:
        "text-xl font-extrabold text-slate-900",

    label:
        "text-xs font-bold text-slate-400",

    value:
        "mt-1 text-sm font-extrabold text-slate-800",

    muted:
        "text-sm font-bold text-slate-500",

    hint:
        "mt-3 text-xs font-bold text-slate-400",
});

export const WAITING_ROOM_CODE_STYLES = Object.freeze({
    wrapper:
        "grid items-center gap-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-5 md:grid-cols-[1fr_150px]",

    codeArea:
        "text-center",

    codeLabel:
        "text-sm font-black text-slate-700",

    code:
        "mt-2 text-6xl font-black tracking-[0.18em] text-blue-700 drop-shadow-sm md:text-7xl",

    description:
        "mt-3 text-sm font-bold text-slate-500",

    qrBox:
        "flex aspect-square min-h-32 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white text-center text-slate-400 shadow-inner",

    qrIcon:
        "text-5xl",

    qrText:
        "mt-2 text-xs font-extrabold text-slate-500",
});

export const WAITING_ROOM_BUTTON_STYLES = Object.freeze({
    actionsGrid:
        "grid gap-3 md:grid-cols-4",

    secondaryAction:
        "flex min-h-12 items-center justify-center gap-2",

    startRace:
        "flex min-h-12 items-center justify-center gap-2 !bg-gradient-to-b !from-lime-400 !to-green-600 !text-base !font-black !text-white shadow-[0_12px_26px_rgba(22,163,74,0.28)] hover:-translate-y-0.5 hover:shadow-lg disabled:!from-slate-300 disabled:!to-slate-400",

    dangerAction:
        "flex min-h-12 items-center justify-center gap-2 border border-rose-100 bg-white text-rose-600 shadow-[0_8px_20px_rgba(225,29,72,0.08)] hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",

    sideAction:
        "flex min-h-12 w-full items-center justify-center gap-2",

    icon:
        "shrink-0",
});

export const WAITING_ROOM_INFO_STYLES = Object.freeze({
    grid:
        "grid gap-3 md:grid-cols-3",

    card:
        "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)]",

    icon:
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-2xl",

    content:
        "min-w-0 text-end",
});

export const WAITING_ROOM_PARTICIPANT_STYLES = Object.freeze({
    panel:
        "rounded-3xl border border-white/80 bg-white/90 p-6 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]",

    grid:
        "mt-5 flex flex-wrap justify-center gap-4",

    slot:
        "relative flex min-h-36 basis-[210px] flex-col items-center justify-end overflow-hidden rounded-3xl border p-4 text-center shadow-[0_10px_24px_rgba(15,23,42,0.08)]",

    joined:
        "border-emerald-200 bg-gradient-to-b from-white to-emerald-50",

    empty:
        "border-slate-200 bg-gradient-to-b from-white to-slate-100 opacity-75",

    numberBadge:
        "absolute start-0 top-0 flex h-10 w-12 items-center justify-center rounded-ee-2xl text-lg font-black text-white",

    joinedBadge:
        "absolute bottom-4 end-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-md",

    avatar:
        "flex h-20 w-24 items-center justify-center rounded-3xl bg-white/70 text-slate-500 shadow-inner",

    placeholderAvatar:
        "flex h-20 w-24 items-center justify-center rounded-3xl bg-slate-200 text-slate-400 shadow-inner",

    vehicleImage:
        "h-full w-full object-contain",

    vehiclePlaceholderIcon:
        "h-10 w-10",

    playerName:
        "mt-3 text-base font-black text-slate-800",

    emptyText:
        "mt-3 text-sm font-extrabold text-slate-400",
});

export const WAITING_ROOM_SIDE_PANEL_STYLES = Object.freeze({
    panel:
        "rounded-3xl border border-white/80 bg-white/85 p-5 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]",

    list:
        "mt-5 grid gap-3",

    item:
        "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)]",

    itemLeft:
        "flex items-center gap-3",

    itemIcon:
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600",

    itemLabel:
        "text-sm font-extrabold text-slate-700",

    itemValue:
        "text-sm font-black text-slate-700",
});