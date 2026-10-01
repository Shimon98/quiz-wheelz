const STAGE_ART = "pointer-events-none absolute block h-auto max-w-none select-none";

export const RACE_RESULTS_STAGE_STYLES = Object.freeze({
  stage:
    "relative isolate block aspect-[var(--qw-stage-aspect)] shrink-0 before:pointer-events-none before:absolute before:-inset-x-[6%] before:inset-y-0 before:-z-10 before:bg-[radial-gradient(ellipse_50%_50%_at_50%_56%,color-mix(in_srgb,var(--qw-lane-accent,var(--qw-accent))_36%,transparent),transparent)] before:content-['']",
  podium: `${STAGE_ART} left-0 top-[var(--qw-stage-podium-top)] w-full`,
  kart: `${STAGE_ART} left-1/2 top-[var(--qw-stage-kart-top)] w-[var(--qw-stage-kart-w)] -translate-x-1/2 drop-shadow-[0_0.5rem_0.4rem_rgba(15,42,67,0.4)]`,
});

export function buildRaceResultsStageStyle(geometry) {
  return {
    "--qw-stage-aspect": String(geometry.stageAspectRatio),
    "--qw-stage-kart-w": `${geometry.kartWidthPercent}%`,
    "--qw-stage-kart-top": `${geometry.kartTopPercent}%`,
    "--qw-stage-podium-top": `${geometry.podiumTopPercent}%`,
  };
}
