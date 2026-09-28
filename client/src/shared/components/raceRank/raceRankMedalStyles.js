const MEDAL_BOX =
  "relative grid h-[var(--qw-medal-size)] w-[var(--qw-medal-size)] shrink-0 place-items-center justify-self-center";

const MEDAL_TEXT = "text-[length:calc(var(--qw-medal-size)*0.5)] font-extrabold";

export const RACE_RANK_MEDAL_STYLES = Object.freeze({
  size: Object.freeze({
    sm: "[--qw-medal-size:1.75rem]",
    md: "[--qw-medal-size:2.5rem]",
    lg: "[--qw-medal-size:4rem]",
    xl: "[--qw-medal-size:5.5rem]",
  }),
  ring: Object.freeze({
    sm: "ring-2",
    md: "ring-2",
    lg: "ring-[3px]",
    xl: "ring-4",
  }),
  plain: `${MEDAL_BOX} ${MEDAL_TEXT} rounded-full bg-[var(--qw-surface)] ring-[color:var(--qw-lane-accent,var(--qw-border))]`,
  medal: MEDAL_BOX,
  ribbon:
    "absolute left-1/2 top-[52%] h-[calc(var(--qw-medal-size)*0.6857)] w-[calc(var(--qw-medal-size)*0.8286)] -translate-x-1/2 [clip-path:polygon(0_0,100%_0,100%_100%,72%_100%,50%_62%,28%_100%,0_100%)]",
  disk: `${MEDAL_BOX} ${MEDAL_TEXT} rounded-full leading-none shadow-[0_1px_2px_rgba(15,42,67,0.45),inset_0_-2px_0_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.6)]`,
  tone: Object.freeze({
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
});
