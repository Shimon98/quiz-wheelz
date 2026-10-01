import { RACE_RESULTS_ART } from "../../../../shared/raceResults/raceResultsArt";
import { STUDENT_RESULTS_TITLE_PLAQUE } from "../../config/studentRaceResultsViewConfig";
import { buildTitlePlaqueStyle, STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";

const PLAQUE_STYLE = buildTitlePlaqueStyle(STUDENT_RESULTS_TITLE_PLAQUE);

export default function StudentResultsTitlePlaque({ label }) {
  return (
    <p className={S.plaque} style={PLAQUE_STYLE} data-results-plaque>
      <img
        className={S.plaqueArt}
        src={RACE_RESULTS_ART.titlePlaque}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <span className={S.plaqueText} data-results-plaque-text>
        {label}
      </span>
    </p>
  );
}
