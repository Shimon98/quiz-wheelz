import { cx } from "../../../utils/classNameUtils";
import { RACE_RESULTS_ART } from "../../raceResults/raceResultsArt";
import { RACE_RESULTS_STAGE_CONFIG } from "./raceResultsStageConfig";
import { buildRaceResultsStageStyle, RACE_RESULTS_STAGE_STYLES as S } from "./raceResultsStageStyles";
import { resolveRaceResultsStageGeometry } from "./resolveRaceResultsStageGeometry";

const STAGE_STYLE = buildRaceResultsStageStyle(resolveRaceResultsStageGeometry(RACE_RESULTS_STAGE_CONFIG));

export default function RaceResultsStage({ kartSrc, className }) {
  return (
    <span className={cx(S.stage, className)} style={STAGE_STYLE} aria-hidden="true" data-results-stage>
      <img className={S.podium} src={RACE_RESULTS_ART.podium} alt="" draggable={false} decoding="async" />
      <img className={S.kart} src={kartSrc} alt="" draggable={false} decoding="async" />
    </span>
  );
}
