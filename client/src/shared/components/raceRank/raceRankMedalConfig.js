export const RACE_RANK_MEDALS = Object.freeze({
  1: "gold",
  2: "silver",
  3: "bronze",
});

export const RACE_RANK_MEDAL_SIZES = Object.freeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
});

export function resolveRaceRankMedal(rank) {
  return RACE_RANK_MEDALS[rank] ?? null;
}
