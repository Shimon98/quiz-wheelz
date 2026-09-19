export const TEACHER_PROJECTOR_STYLES = Object.freeze({
  surface:
    "@container relative isolate flex min-h-[70dvh] flex-col gap-3 overflow-hidden rounded-[var(--qw-radius-2xl)] border border-[var(--qw-border)] bg-[var(--qw-bg)] p-3 text-[var(--qw-text)] shadow-[var(--qw-shadow-card)] sm:p-4 [&:fullscreen]:min-h-dvh [&:fullscreen]:overflow-auto [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:p-6",

  decorLayer: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
  decorBlobPrimary:
    "absolute -top-24 -start-16 h-72 w-72 rounded-full bg-[var(--qw-green)] opacity-[0.10] blur-3xl",
  decorBlobSecondary:
    "absolute -bottom-28 -end-20 h-80 w-80 rounded-full bg-[var(--qw-sky)] opacity-[0.10] blur-3xl",

  header:
    "relative z-10 grid grid-cols-1 items-center gap-3 @3xl:grid-cols-[auto_1fr_auto]",
  headerBrand: "justify-self-center text-xl font-extrabold @3xl:justify-self-start @6xl:text-2xl",
  headerIdentity: "flex min-w-0 flex-wrap items-center justify-center gap-2 text-center",
  headerTitle: "min-w-0 truncate text-2xl font-extrabold @6xl:text-3xl",
  headerStats: "flex flex-wrap items-center justify-center gap-2 @3xl:justify-end",

  main:
    "relative z-10 grid flex-1 grid-cols-1 gap-3 @3xl:grid-cols-2 @6xl:grid-cols-[18fr_64fr_18fr]",
  leaderboardPanel: "order-2 min-w-0 @6xl:order-1",
  trackPanel: "order-1 min-w-0 @3xl:col-span-2 @6xl:order-2 @6xl:col-span-1",
  eventsPanel: "order-3 min-w-0",

  panel:
    "flex h-full flex-col gap-2 rounded-[var(--qw-radius-xl)] border border-[var(--qw-border)] bg-[var(--qw-surface)] p-3 shadow-[var(--qw-shadow-sm)]",
  panelTitle:
    "text-xs font-extrabold uppercase tracking-wider text-[var(--qw-text-muted)]",

  track: "flex flex-1 flex-col gap-2",
  trackEdges:
    "flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[var(--qw-text-muted)]",
  laneStack: "flex flex-col gap-1.5",
  lane: "grid grid-cols-[minmax(0,6.5rem)_1fr] items-center gap-2 @3xl:grid-cols-[minmax(0,9rem)_1fr]",
  laneLabel: "flex min-w-0 items-center gap-1.5 text-sm font-bold",
  laneName: "min-w-0 truncate",
  laneStrip:
    "relative h-9 rounded-full border border-[var(--qw-border)] bg-[var(--qw-surface-alt)] @6xl:h-11",
  laneRail:
    "absolute inset-y-0 left-[var(--qw-projector-rail-inset)] right-[var(--qw-projector-rail-inset)]",
  laneVehicleSlot:
    "absolute top-1/2 h-[var(--qw-projector-vehicle-h)] w-[var(--qw-projector-vehicle-w)] -translate-x-1/2 -translate-y-1/2",
  muted: "opacity-55",

  vehicle:
    "relative h-full w-full rounded-full border-2 border-white/70 shadow-[var(--qw-shadow-sm)]",
  vehicleFallback: "bg-[var(--qw-secondary)]",
  vehicleCabin:
    "absolute left-1/2 top-1/2 h-[46%] w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85",

  scale:
    "relative mx-[var(--qw-projector-rail-inset)] h-4 text-[0.65rem] font-bold text-[var(--qw-text-muted)]",
  scaleMarker: "absolute top-0 -translate-x-1/2",
  scaleMarkerWide: "hidden @3xl:block",

  leaderboardList: "m-0 flex list-none flex-col gap-1.5 p-0",
  leaderboardRow:
    "grid grid-cols-[2rem_0.75rem_1fr_auto] items-center gap-2 rounded-[var(--qw-radius-md)] bg-[var(--qw-surface-alt)] px-2 py-1.5",
  leaderboardRank: "text-center text-lg font-extrabold",
  leaderboardSwatch: "h-3 w-3 rounded-full",
  leaderboardName: "min-w-0 truncate text-sm font-bold",
  leaderboardMeta: "flex items-center gap-2 text-xs text-[var(--qw-text-muted)]",

  eventsList: "m-0 flex list-none flex-col gap-1.5 p-0",
  eventItem:
    "grid grid-cols-[auto_1fr] items-start gap-2 rounded-[var(--qw-radius-md)] bg-[var(--qw-surface-alt)] px-2 py-1.5",
  eventText: "text-sm font-semibold",
  eventTime: "text-xs text-[var(--qw-text-muted)]",
  eventsEmpty: "text-sm text-[var(--qw-text-muted)]",

  footer:
    "relative z-10 grid grid-cols-1 items-center gap-2 @3xl:grid-cols-[1fr_auto_1fr]",
  footerBack: "justify-self-center @3xl:justify-self-start",
  footerBrand: "justify-self-center text-base font-extrabold",
  footerConnection:
    "flex items-center gap-1.5 justify-self-center text-sm font-semibold @3xl:justify-self-end",

  finishedBanner: "relative z-10 flex justify-center",
  finishedCard:
    "flex flex-col items-center gap-1 rounded-[var(--qw-radius-xl)] border border-[var(--qw-accent)] bg-[var(--qw-surface)] px-5 py-3 text-center shadow-[var(--qw-shadow-card)]",
});

export function buildProjectorSurfaceStyle(laneGeometry) {
  return {
    "--qw-projector-vehicle-w": `${laneGeometry.vehicleWidthRem}rem`,
    "--qw-projector-vehicle-h": `${laneGeometry.vehicleHeightRem}rem`,
    "--qw-projector-rail-inset": `${laneGeometry.railInsetRem}rem`,
  };
}
