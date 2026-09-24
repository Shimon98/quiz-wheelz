import { resolveTeacherVehicleGeometry } from "../utils/resolveTeacherVehicleGeometry";

const VEHICLE_GEOMETRY_TIERS =
  "[--qw-projector-vehicle-w:var(--qw-projector-vehicle-w-compact)] [--qw-projector-vehicle-h:var(--qw-projector-vehicle-h-compact)] [--qw-projector-rail-inset:var(--qw-projector-rail-inset-compact)] @6xl:[--qw-projector-vehicle-w:var(--qw-projector-vehicle-w-wide)] @6xl:[--qw-projector-vehicle-h:var(--qw-projector-vehicle-h-wide)] @6xl:[--qw-projector-rail-inset:var(--qw-projector-rail-inset-wide)]";

const SIGN_HEIGHT_TIERS =
  "[--qw-sign-h:4.5rem] @6xl:[--qw-sign-h:clamp(4.5rem,10vh,8rem)]";

const TITLE_HEIGHT_TIERS = "[--qw-title-h:4.75rem] @6xl:[--qw-title-h:5.75rem]";

const ACCENT_ART =
  "pointer-events-none w-auto shrink-0 select-none drop-shadow-[0_1px_1.5px_rgba(15,42,67,0.4)]";

const LANE_COLUMNS =
  "grid grid-cols-[minmax(0,6.5rem)_1fr] gap-2 @3xl:grid-cols-[minmax(0,9rem)_1fr]";

const LANE_ACCENT_FALLBACK = "var(--qw-secondary)";

const GLASS =
  "rounded-[var(--qw-radius-xl)] border border-[var(--qw-projector-glass-border)] bg-[var(--qw-projector-glass)] shadow-[var(--qw-shadow-card)] backdrop-blur-sm";

const CHECKERED =
  "bg-[repeating-conic-gradient(var(--qw-ink)_0_25%,#ffffff_0_50%)] bg-[length:0.5rem_0.5rem]";

const WORLD_VERGE =
  "absolute bottom-0 hidden w-[clamp(16rem,34cqw,38rem)] max-w-[48%] translate-y-[16%] @3xl:block";

export const TEACHER_PROJECTOR_STYLES = Object.freeze({
  surface:
    "@container relative isolate flex min-h-[calc(100dvh-var(--app-shell-header-offset,0rem)-var(--app-shell-footer-offset,0rem)-2*var(--app-shell-padding,0rem))] flex-col gap-3 overflow-hidden rounded-[var(--qw-radius-2xl)] border border-[var(--qw-border)] bg-[linear-gradient(180deg,var(--qw-projector-sky)_0%,var(--qw-projector-horizon)_46%,var(--qw-projector-ground)_100%)] p-3 text-[var(--qw-text)] shadow-[var(--qw-shadow-card)] sm:p-4 [&:fullscreen]:min-h-dvh [&:fullscreen]:overflow-auto [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:p-6",

  decorLayer: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
  worldBackdrop:
    "absolute inset-0 block h-full w-full select-none object-cover object-center [filter:var(--qw-projector-backdrop-filter)]",
  worldTint: "absolute inset-0 bg-[var(--qw-projector-tint)]",
  worldVerge: "block h-auto w-full select-none",
  worldVergeStart: `${WORLD_VERGE} left-0 -translate-x-[10%]`,
  worldVergeEnd: `${WORLD_VERGE} right-0 translate-x-[10%] -scale-x-100`,

  header: `relative z-10 grid grid-cols-1 items-center gap-3 ${GLASS} px-3 py-2 sm:px-4`,
  headerColumns: "@3xl:grid-cols-[1fr_auto] @6xl:grid-cols-[1fr_auto_1fr]",
  headerColumnsWithBrand: "@3xl:grid-cols-[auto_1fr_auto] @6xl:grid-cols-[1fr_auto_1fr]",
  headerBrand:
    "justify-self-center text-xl font-extrabold @3xl:justify-self-start @6xl:col-start-1 @6xl:text-2xl",
  headerIdentity:
    "flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 text-center @3xl:relative @3xl:flex-nowrap @6xl:col-start-2 @6xl:max-w-[46cqw] @6xl:justify-self-center",
  headerTitle: `relative min-w-0 max-w-full text-2xl font-extrabold tracking-tight @3xl:flex @3xl:h-[var(--qw-title-h)] @3xl:min-w-[calc(var(--qw-title-h)*var(--qw-title-natural-w))] @3xl:items-center @3xl:justify-center @3xl:pl-[calc(var(--qw-title-h)*var(--qw-title-pad-l))] @3xl:pr-[calc(var(--qw-title-h)*var(--qw-title-pad-r))] @3xl:pt-[calc(var(--qw-title-h)*var(--qw-title-shift))] @3xl:text-[length:calc(var(--qw-title-h)*var(--qw-title-font))] @3xl:leading-none @3xl:text-[var(--qw-ink)] ${TITLE_HEIGHT_TIERS}`,
  headerTitleArt: "pointer-events-none absolute inset-0 hidden select-none @3xl:block",
  headerTitleText: "relative block min-w-0 truncate",
  headerStatus:
    "inline-flex @3xl:absolute @3xl:bottom-0 @3xl:left-1/2 @3xl:z-10 @3xl:-translate-x-1/2 @3xl:translate-y-[35%]",
  headerStats:
    "flex flex-wrap items-center justify-center gap-2 @3xl:justify-end @6xl:col-start-3 @6xl:min-w-max @6xl:flex-nowrap",

  main:
    "relative z-10 grid flex-1 grid-cols-1 items-start gap-3 @3xl:grid-cols-2 @6xl:grid-cols-[18fr_64fr_18fr]",
  leaderboardPanel: "@container order-2 min-w-0 @6xl:order-1",
  trackPanel: "order-1 min-w-0 @3xl:col-span-2 @6xl:order-2 @6xl:col-span-1",
  eventsPanel: "order-3 min-w-0",

  panel: `flex flex-col gap-2 ${GLASS} p-3`,
  panelTitle:
    "flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[var(--qw-text-muted)]",
  panelTitleArt: `${ACCENT_ART} h-6 @6xl:h-7`,
  trackSurface: "bg-[var(--qw-projector-track-glass)] shadow-[var(--qw-shadow-lg)]",

  track: `flex flex-1 flex-col gap-2 ${VEHICLE_GEOMETRY_TIERS}`,
  trackEdges: `${LANE_COLUMNS} items-end @3xl:-mb-2`,
  trackSigns: `mx-[var(--qw-projector-rail-inset)] flex items-end justify-between ${SIGN_HEIGHT_TIERS}`,
  trackSign:
    "relative inline-flex items-center @3xl:block @3xl:h-[var(--qw-sign-h)] @3xl:aspect-[var(--qw-sign-aspect)]",
  trackSignStart: "@3xl:origin-bottom-left",
  trackSignFinish: "@3xl:origin-bottom-right",
  trackSignArt:
    "pointer-events-none hidden h-full w-full select-none object-contain drop-shadow-[0_4px_4px_rgba(15,42,67,0.3)] @3xl:block",
  trackSignLabel:
    "rounded-[var(--qw-radius-sm)] px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider shadow-[var(--qw-shadow-sm)] @3xl:absolute @3xl:left-[var(--qw-sign-box-left)] @3xl:top-[var(--qw-sign-box-top)] @3xl:grid @3xl:h-[var(--qw-sign-box-height)] @3xl:w-[var(--qw-sign-box-width)] @3xl:place-items-center @3xl:overflow-hidden @3xl:rounded-none @3xl:bg-transparent @3xl:p-0 @3xl:text-[length:calc(var(--qw-sign-h)*0.15)] @3xl:leading-none @3xl:tracking-normal @3xl:text-[var(--qw-ink)] @3xl:shadow-none",
  trackSignLabelStart: "bg-[var(--qw-primary)] text-[var(--qw-primary-contrast)]",
  trackSignLabelFinish: "bg-[var(--qw-ink)] text-white",
  laneStack: "flex flex-col gap-1.5",
  lane: `${LANE_COLUMNS} items-center`,
  laneLabel: "flex min-w-0 items-center gap-1.5 text-sm font-bold @6xl:text-base",
  laneName: "min-w-0 truncate",
  laneStrip:
    "relative h-9 rounded-full border border-[var(--qw-projector-lane-line)] bg-[color:color-mix(in_srgb,var(--qw-lane-accent)_22%,var(--qw-projector-lane))] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] @6xl:h-11",
  laneRail:
    "absolute inset-y-0 left-[var(--qw-projector-rail-inset)] right-[var(--qw-projector-rail-inset)]",
  laneRailLine:
    "absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--qw-projector-lane-line)]",
  laneGuide:
    "absolute inset-y-1.5 w-0 -translate-x-1/2 border-l border-dashed border-[var(--qw-projector-lane-line)]",
  laneGuideStart: "border-l-2 border-solid border-[var(--qw-primary)]",
  laneGuideFinish: `${CHECKERED} inset-y-1 w-2 rounded-sm border-0`,
  laneProgressFill:
    "absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--qw-lane-accent)] shadow-[0_0_6px_var(--qw-lane-accent)]",
  laneVehicleSlot:
    "absolute top-1/2 h-[var(--qw-projector-vehicle-h)] w-[var(--qw-projector-vehicle-w)] -translate-x-1/2 -translate-y-1/2",
  muted: "opacity-55",
  laneVehicleMuted: "opacity-80",

  vehicleImage:
    "pointer-events-none block h-full w-full select-none object-contain drop-shadow-[0_3px_3px_rgba(15,42,67,0.35)]",
  vehicle:
    "relative h-full w-full rounded-full border-2 border-white/70 shadow-[var(--qw-shadow-sm)]",
  vehicleFallback: "bg-[var(--qw-secondary)]",
  vehicleCabin:
    "absolute left-1/2 top-1/2 h-[46%] w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85",

  scale: `${LANE_COLUMNS} text-[0.65rem] font-bold text-[var(--qw-text-muted)] @6xl:text-xs`,
  scaleTrack: "relative mx-[var(--qw-projector-rail-inset)] h-4",
  scaleMarker: "absolute top-0 -translate-x-1/2",
  scaleMarkerWide: "hidden @3xl:block",

  leaderboardList: "m-0 flex list-none flex-col gap-1.5 p-0",
  leaderboardRow:
    "relative grid grid-cols-[2rem_0.75rem_1fr_auto] items-center gap-2 overflow-hidden rounded-[var(--qw-radius-md)] border border-[var(--qw-projector-glass-border)] bg-[var(--qw-surface-alt)] px-2 pb-2.5 pt-1.5 transition-shadow duration-300 ease-out motion-reduce:transition-none",
  leaderboardRowTier: Object.freeze({
    first:
      "shadow-[var(--qw-shadow-sm),0_0_0_2px_var(--qw-projector-rank-1-ring),0_0_18px_2px_var(--qw-projector-rank-1-glow)]",
    second:
      "shadow-[var(--qw-shadow-sm),0_0_0_1.5px_var(--qw-projector-rank-2-ring),0_0_8px_var(--qw-projector-rank-2-glow)]",
    third:
      "shadow-[var(--qw-shadow-sm),0_0_0_1px_var(--qw-projector-rank-3-ring),0_0_6px_var(--qw-projector-rank-3-glow)]",
    none: "shadow-[var(--qw-shadow-sm)]",
  }),
  leaderboardRank:
    "grid h-7 w-7 place-items-center justify-self-center rounded-full bg-[var(--qw-surface)] text-sm font-extrabold ring-2 ring-[color:var(--qw-lane-accent)]",
  leaderboardMedal: "relative grid h-7 w-7 place-items-center justify-self-center",
  leaderboardMedalRibbon:
    "absolute left-1/2 top-[52%] h-[1.2rem] w-[1.45rem] -translate-x-1/2 [clip-path:polygon(0_0,100%_0,100%_100%,72%_100%,50%_62%,28%_100%,0_100%)]",
  leaderboardMedalDisk:
    "relative grid h-7 w-7 place-items-center rounded-full text-sm font-extrabold leading-none ring-2 shadow-[0_1px_2px_rgba(15,42,67,0.45),inset_0_-2px_0_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.6)]",
  leaderboardMedalTone: Object.freeze({
    gold: Object.freeze({
      disk: "bg-[radial-gradient(circle_at_35%_28%,#fff7cc_0%,#ffd84d_32%,#f2a91c_66%,#b36b06_100%)] text-[#5c3700] ring-[#ffe58f]",
      ribbon: "bg-[linear-gradient(90deg,#e5484d_0_50%,#b8282d_50%_100%)]",
    }),
    silver: Object.freeze({
      disk: "bg-[radial-gradient(circle_at_35%_28%,#ffffff_0%,#e6eaef_34%,#b9c1cb_68%,#7f8894_100%)] text-[#27303a] ring-[#f3f5f8]",
      ribbon: "bg-[linear-gradient(90deg,#3ba9f4_0_50%,#1e6fb8_50%_100%)]",
    }),
    bronze: Object.freeze({
      disk: "bg-[radial-gradient(circle_at_35%_28%,#ffe3c6_0%,#eba56a_34%,#bb6c2f_68%,#7c4115_100%)] text-[#3b1d05] ring-[#f7cda6]",
      ribbon: "bg-[linear-gradient(90deg,#2fa84f_0_50%,#1d7a39_50%_100%)]",
    }),
  }),
  leaderboardSwatch: "h-3 w-3 rounded-full",
  leaderboardName: "min-w-0 truncate text-sm font-bold @6xl:text-base",
  leaderboardMeta: "flex items-center gap-2 text-xs text-[var(--qw-text-muted)]",
  leaderboardStreak: "hidden @min-[20rem]:inline",
  leaderboardProgress: "hidden @min-[17rem]:inline",
  leaderboardBar:
    "absolute inset-x-2 bottom-0 h-1 overflow-hidden rounded-full bg-[var(--qw-projector-lane-line)]",
  leaderboardBarFill:
    "block h-full rounded-full bg-[color:var(--qw-lane-accent)] transition-[width] ease-linear motion-reduce:transition-none",

  eventsList: "m-0 flex list-none flex-col gap-1.5 p-0",
  eventItem:
    "grid grid-cols-[auto_1fr] items-start gap-2 rounded-[var(--qw-radius-md)] border border-[var(--qw-projector-glass-border)] bg-[var(--qw-surface-alt)] px-2 py-1.5 shadow-[var(--qw-shadow-sm)]",
  eventText: "text-sm font-semibold @6xl:text-base",
  eventTime: "text-xs text-[var(--qw-text-muted)]",
  eventsEmpty: "text-sm text-[var(--qw-text-muted)]",

  footer: `relative z-10 grid grid-cols-1 items-center gap-2 ${GLASS} px-3 py-2 @3xl:grid-cols-2`,
  footerBack: "justify-self-center @3xl:justify-self-start",
  footerConnection:
    "flex items-center gap-1.5 justify-self-center text-sm font-semibold @3xl:justify-self-end",
  footerConnectionArt: `${ACCENT_ART} h-6`,

  finishedBanner: "relative z-10 flex justify-center",
  finishedCard:
    "flex items-center gap-4 rounded-[var(--qw-radius-xl)] border-2 border-[var(--qw-accent)] bg-[var(--qw-projector-glass)] px-6 py-3 text-center shadow-[var(--qw-shadow-lg)] backdrop-blur-sm",
  finishedTrophy: `${ACCENT_ART} h-12 drop-shadow-[0_0_10px_rgba(245,166,35,0.55)] @6xl:h-14`,
  finishedText: "flex flex-col items-center gap-1",
});

export function buildLaneAccentStyle(accentColor) {
  return { "--qw-lane-accent": accentColor ?? LANE_ACCENT_FALLBACK };
}

export function buildSignStyle(board) {
  return {
    "--qw-sign-aspect": String(board.aspectRatio),
    "--qw-sign-box-left": `${board.textBox.left}%`,
    "--qw-sign-box-top": `${board.textBox.top}%`,
    "--qw-sign-box-width": `${board.textBox.width}%`,
    "--qw-sign-box-height": `${board.textBox.height}%`,
  };
}

export function buildTitleBadgeStyles(artUrl, badge) {
  const capLeft = `calc(var(--qw-title-h) * ${badge.capLeft})`;
  const capRight = `calc(var(--qw-title-h) * ${badge.capRight})`;

  return {
    title: {
      "--qw-title-natural-w": String(badge.aspectRatio),
      "--qw-title-pad-l": String(badge.textPadLeft),
      "--qw-title-pad-r": String(badge.textPadRight),
      "--qw-title-shift": String(badge.textShift),
      "--qw-title-font": String(badge.fontScale),
    },
    art: {
      borderStyle: "solid",
      borderWidth: 0,
      borderImageSource: `url("${artUrl}")`,
      borderImageSlice: `0 ${badge.sliceRightPx} 0 ${badge.sliceLeftPx} fill`,
      borderImageWidth: `0 ${capRight} 0 ${capLeft}`,
      borderImageRepeat: "stretch",
    },
  };
}

export function buildProjectorSurfaceStyle(laneGeometry) {
  const { compact, wide } = resolveTeacherVehicleGeometry(laneGeometry);

  return {
    "--qw-projector-vehicle-w-compact": `${compact.widthRem}rem`,
    "--qw-projector-vehicle-h-compact": `${compact.heightRem}rem`,
    "--qw-projector-rail-inset-compact": `${compact.railInsetRem}rem`,
    "--qw-projector-vehicle-w-wide": `${wide.widthRem}rem`,
    "--qw-projector-vehicle-h-wide": `${wide.heightRem}rem`,
    "--qw-projector-rail-inset-wide": `${wide.railInsetRem}rem`,
  };
}
