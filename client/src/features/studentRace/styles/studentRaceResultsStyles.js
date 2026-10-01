import { RACE_CHECKERED_PATTERN } from "../../../shared/styles/raceAccentStyles";

const PLAQUE_HEIGHT_TIERS = "[--qw-plaque-h:5rem] @3xl:[--qw-plaque-h:6rem]";

export const STUDENT_RESULTS_STYLES = Object.freeze({
  page: "relative isolate min-h-dvh w-full overflow-x-hidden text-[var(--qw-text)]",
  backdrop:
    "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[linear-gradient(180deg,var(--qw-projector-sky)_0%,var(--qw-projector-horizon)_42%,var(--qw-bg)_78%)]",
  backdropArt:
    "absolute inset-x-0 top-0 block h-[60dvh] w-full select-none object-cover object-bottom [filter:var(--qw-projector-backdrop-filter)]",
  backdropTint: "absolute inset-0 bg-[var(--qw-projector-tint)]",
  shell: "@container mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:py-6",

  header: `relative flex flex-col items-center ${PLAQUE_HEIGHT_TIERS}`,
  headerCard: "w-full",
  headerBand:
    "flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-[calc(var(--qw-plaque-h)*0.3)] text-center",
  plaque:
    "relative z-10 m-0 -mb-[calc(var(--qw-plaque-h)*0.3)] block aspect-[var(--qw-plaque-aspect)] h-[var(--qw-plaque-h)] shrink-0 drop-shadow-[0_4px_5px_rgba(15,42,67,0.3)]",
  plaqueArt: "pointer-events-none absolute inset-0 block h-full w-full select-none",
  plaqueText:
    "absolute left-[var(--qw-plaque-box-left)] top-[var(--qw-plaque-box-top)] grid h-[var(--qw-plaque-box-height)] w-[var(--qw-plaque-box-width)] place-items-center whitespace-nowrap text-center text-[length:calc(var(--qw-plaque-h)*var(--qw-plaque-font))] font-extrabold leading-none text-[var(--qw-ink)]",
  eyebrow: "text-xs font-extrabold uppercase tracking-wider text-[var(--qw-text-muted)]",
  title: "min-w-0 max-w-full outline-none",
  nameText: "inline-block max-w-full truncate align-top",

  grid: "grid grid-cols-1 items-start gap-4 @3xl:grid-cols-2 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
  column: "flex min-w-0 flex-col gap-4",

  hero: "flex flex-col items-center gap-3 text-center",
  heroBadge: "grid min-h-[5.5rem] place-items-center",
  heroPending:
    "grid size-[5.5rem] place-items-center rounded-full border-4 border-dashed border-[var(--qw-border)] text-[var(--qw-text-muted)]",
  heroLive: "flex flex-col items-center gap-1",
  heroStage: "w-[min(100%,22rem,37dvh)]",
  heroKart: "h-16 w-auto select-none object-contain drop-shadow-[0_3px_3px_rgba(15,42,67,0.35)] @3xl:h-20",
  heroKartMuted: "opacity-60 grayscale",
  heroName: "m-0 max-w-full text-xl font-extrabold",
  heroStats: "grid w-full grid-cols-2 gap-3",

  progressTitle: "flex items-center gap-2",
  progressFlag: `inline-block size-4 shrink-0 rounded-[0.2rem] ring-1 ring-[color:var(--qw-border)] ${RACE_CHECKERED_PATTERN}`,

  summary: "flex items-center gap-3",
  action: "self-center",

  board: "flex flex-col",
  group:
    "mt-3 flex flex-col gap-1 border-t border-[var(--qw-border)] pt-3 first:mt-0 first:border-t-0 first:pt-0",
  groupTitle: "flex items-center gap-2",
  groupIcon:
    "grid size-7 shrink-0 place-items-center rounded-full bg-[var(--qw-surface-alt)] text-[var(--qw-text-muted)]",
  list: "m-0 flex list-none flex-col p-0",
  row: "relative flex min-h-12 items-center gap-2 border-b border-[var(--qw-border)] py-1.5 pe-2 ps-3 last:border-b-0 before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-full before:bg-[color:var(--qw-lane-accent,var(--qw-border))]",
  rowMe:
    "rounded-[var(--qw-radius-md)] border-b-transparent bg-[color-mix(in_srgb,var(--qw-primary)_14%,transparent)]",
  rowLead: "grid w-10 shrink-0 place-items-center",
  rowStatusIcon:
    "grid size-7 place-items-center rounded-full bg-[var(--qw-surface)] text-[var(--qw-text-muted)] ring-2 ring-[color:var(--qw-border)]",
  rowKart: "hidden h-7 w-auto shrink-0 select-none object-contain @min-[20rem]:block",
  rowKartMuted: "opacity-50 grayscale",
  rowIdentity: "flex min-w-0 flex-1 items-center gap-2",
  rowName: "min-w-0 truncate font-bold",
  rowStatus: "shrink-0 whitespace-nowrap text-xs font-semibold text-[var(--qw-text-muted)]",
});

export function buildTitlePlaqueStyle(plaque) {
  return {
    "--qw-plaque-aspect": String(plaque.aspectRatio),
    "--qw-plaque-font": String(plaque.fontScale),
    "--qw-plaque-box-left": `${plaque.textBox.left}%`,
    "--qw-plaque-box-top": `${plaque.textBox.top}%`,
    "--qw-plaque-box-width": `${plaque.textBox.width}%`,
    "--qw-plaque-box-height": `${plaque.textBox.height}%`,
  };
}
