import { cx } from "../../../utils/classNameUtils";
import { RACE_PLACEMENTS, RACE_PLACEMENT_SIZES, resolveRacePlacement } from "./racePlacementConfig";
import { RACE_PLACEMENT_STYLES as S } from "./racePlacementStyles";

export default function RacePlacementBadge({
  rank,
  placementArtEligible = false,
  size = RACE_PLACEMENT_SIZES.SM,
  accentColor = null,
}) {
  const { placement, art } = resolveRacePlacement(rank, placementArtEligible);
  const sizeClass = S.size[size] ?? S.size[RACE_PLACEMENT_SIZES.SM];

  if (!art) {
    return (
      <span
        className={cx(S.quiet, sizeClass, S.ring[size] ?? S.ring[RACE_PLACEMENT_SIZES.SM])}
        style={accentColor ? { "--qw-lane-accent": accentColor } : undefined}
        data-placement={placement}
      >
        {rank}
      </span>
    );
  }

  return (
    <span className={cx(S.art, sizeClass)} data-placement={placement}>
      <img className={S.artImage} src={art} alt="" aria-hidden="true" draggable={false} />
      <span className={placement === RACE_PLACEMENTS.WOOD ? S.woodRank : S.artRank}>{rank}</span>
    </span>
  );
}
