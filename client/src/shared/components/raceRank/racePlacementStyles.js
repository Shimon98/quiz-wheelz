const PLACEMENT_BOX =
  "relative grid h-[var(--qw-placement-size)] w-[var(--qw-placement-size)] shrink-0 place-items-center justify-self-center";

export const RACE_PLACEMENT_STYLES = Object.freeze({
  size: Object.freeze({
    sm: "[--qw-placement-size:2rem]",
    md: "[--qw-placement-size:3.25rem]",
    lg: "[--qw-placement-size:5rem]",
    xl: "[--qw-placement-size:clamp(5.5rem,13.5dvh,9rem)]",
  }),
  ring: Object.freeze({
    sm: "ring-2",
    md: "ring-2",
    lg: "ring-[3px]",
    xl: "ring-4",
  }),
  quiet: `${PLACEMENT_BOX} rounded-full bg-[var(--qw-surface)] text-[length:calc(var(--qw-placement-size)*0.5)] font-extrabold ring-[color:var(--qw-lane-accent,var(--qw-border))]`,
  art: PLACEMENT_BOX,
  artImage:
    "pointer-events-none block h-full w-full select-none object-contain drop-shadow-[0_2px_2px_rgba(15,42,67,0.35)]",
  artRank: "sr-only",
  woodRank:
    "absolute inset-0 grid place-items-center text-[length:calc(var(--qw-placement-size)*0.4)] font-extrabold leading-none text-[#3b1d05] [text-shadow:0_1px_0_rgba(255,236,200,0.55)]",
});
