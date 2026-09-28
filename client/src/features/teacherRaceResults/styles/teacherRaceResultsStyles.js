import { TEACHER_PROJECTOR_STYLES as P } from "../../teacherLiveRace/styles/teacherRaceProjectorStyles";

const CARD =
  "rounded-[var(--qw-radius-md)] border border-[var(--qw-projector-glass-border)] bg-[var(--qw-surface-alt)] shadow-[var(--qw-shadow-sm)]";

export const TEACHER_RESULTS_STYLES = Object.freeze({
  surface: P.surface,
  header: P.header,
  headerColumns: P.headerColumns,
  headerColumnsWithBrand: P.headerColumnsWithBrand,
  headerBrand: P.headerBrand,
  headerIdentity: P.headerIdentity,
  headerStatus: P.headerStatus,
  headerMeta:
    "flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-[var(--qw-text-muted)] @3xl:justify-end @6xl:col-start-3",
  panel: P.panel,
  panelTitle: P.panelTitle,
  panelTitleArt: P.panelTitleArt,
  footer: P.footer,
  footerBack: P.footerBack,

  summary: "relative z-10 grid grid-cols-2 gap-2 @3xl:grid-cols-3 @6xl:grid-cols-6",
  main: "relative z-10 grid flex-1 grid-cols-1 items-start gap-3 @3xl:grid-cols-2 @6xl:grid-cols-[22fr_52fr_26fr]",
  winnersColumn: "order-1 min-w-0",
  standingsColumn: "@container order-2 min-w-0 @3xl:order-3 @3xl:col-span-2 @6xl:order-2 @6xl:col-span-1",
  awardsColumn: "order-3 min-w-0 @3xl:order-2 @6xl:order-3",

  emptyText: "text-sm text-[var(--qw-text-muted)]",

  winnersList: "m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3 p-0",
  winnerCard: `${CARD} flex flex-col items-center gap-2 p-3 text-center`,
  winnerKart: "h-16 w-auto select-none object-contain drop-shadow-[0_3px_3px_rgba(15,42,67,0.35)] @6xl:h-20",
  winnerName: "max-w-full truncate text-lg font-extrabold",
  winnerScore: "text-base font-bold",
  winnerMeta: "text-xs text-[var(--qw-text-muted)]",

  standingsNote: "text-xs text-[var(--qw-text-muted)]",
  table: "min-w-0 [&_td]:align-middle [&_th]:whitespace-nowrap",
  nameCell: "w-full max-w-0",
  playerCell: "flex min-w-0 items-center gap-2 font-bold",
  standingKart: "hidden h-6 w-auto shrink-0 select-none object-contain @min-[24rem]:block",
  standingKartMuted: "opacity-50 grayscale",
  standingName: "min-w-0 truncate",
  statusText: "whitespace-nowrap text-xs font-semibold text-[var(--qw-text-muted)]",
  cellWide: "hidden @min-[34rem]:table-cell",
  cellWider: "hidden @min-[40rem]:table-cell",

  awardList: "m-0 flex list-none flex-col gap-2 p-0",
  awardCard: `${CARD} grid grid-cols-[auto_1fr] items-center gap-3 px-3 py-2`,
  awardText: "flex min-w-0 flex-col",
  awardLabel: "text-sm font-extrabold",
  awardNames: "truncate text-sm",
  awardValue: "text-xs text-[var(--qw-text-muted)]",
});
