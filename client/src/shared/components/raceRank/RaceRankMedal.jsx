import { cx } from "../../../utils/classNameUtils";
import { RACE_RANK_MEDAL_SIZES } from "./raceRankMedalConfig";
import { RACE_RANK_MEDAL_STYLES as S } from "./raceRankMedalStyles";

export default function RaceRankMedal({
  rank,
  medal = null,
  size = RACE_RANK_MEDAL_SIZES.SM,
  accentColor = null,
}) {
  const sizeClass = S.size[size] ?? S.size[RACE_RANK_MEDAL_SIZES.SM];
  const ringClass = S.ring[size] ?? S.ring[RACE_RANK_MEDAL_SIZES.SM];
  const tone = medal ? S.tone[medal] : null;

  if (!tone) {
    return (
      <span
        className={cx(S.plain, sizeClass, ringClass)}
        style={accentColor ? { "--qw-lane-accent": accentColor } : undefined}
      >
        {rank}
      </span>
    );
  }

  return (
    <span className={cx(S.medal, sizeClass)} data-medal={medal}>
      <span className={cx(S.ribbon, tone.ribbon)} aria-hidden="true" />
      <span className={cx(S.disk, ringClass, tone.disk)}>{rank}</span>
    </span>
  );
}
