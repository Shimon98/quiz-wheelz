import { RACE_RESULTS_ART } from "../../raceResults/raceResultsArt";

export const RACE_PLACEMENTS = Object.freeze({
  GOLD: "gold",
  SILVER: "silver",
  BRONZE: "bronze",
  WOOD: "wood",
  QUIET: "quiet",
});

export const RACE_PLACEMENT_SIZES = Object.freeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
});

const PODIUM_PLACEMENTS = Object.freeze({
  1: RACE_PLACEMENTS.GOLD,
  2: RACE_PLACEMENTS.SILVER,
  3: RACE_PLACEMENTS.BRONZE,
});

const QUIET_PLACEMENT = Object.freeze({ placement: RACE_PLACEMENTS.QUIET, art: null });

export function resolveRacePlacement(rank, placementArtEligible) {
  if (!placementArtEligible || !Number.isSafeInteger(rank) || rank < 1) {
    return QUIET_PLACEMENT;
  }

  const placement = PODIUM_PLACEMENTS[rank] ?? RACE_PLACEMENTS.WOOD;

  return Object.freeze({ placement, art: RACE_RESULTS_ART.placement[placement] });
}
