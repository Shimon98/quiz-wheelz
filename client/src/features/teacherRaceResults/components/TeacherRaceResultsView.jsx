import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import TeacherRaceWorld from "../../teacherLiveRace/components/TeacherRaceWorld";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";
import TeacherResultsHeader from "./TeacherResultsHeader";
import TeacherResultsSummary from "./TeacherResultsSummary";
import TeacherResultsWinners from "./TeacherResultsWinners";
import TeacherResultsStandings from "./TeacherResultsStandings";
import TeacherResultsAwards from "./TeacherResultsAwards";
import TeacherResultsFooter from "./TeacherResultsFooter";

export default function TeacherRaceResultsView({
  surfaceRef,
  viewModel,
  fullscreen,
  fullscreenSupported,
  onToggleFullscreen,
  onBackToRaces,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);

  return (
    <section
      ref={surfaceRef}
      className={S.surface}
      aria-label={t("header.regionLabel", { title: viewModel.header.title })}
    >
      <TeacherRaceWorld />

      <TeacherResultsHeader
        header={viewModel.header}
        fullscreen={fullscreen}
        fullscreenSupported={fullscreenSupported}
        onToggleFullscreen={onToggleFullscreen}
      />

      <TeacherResultsSummary summary={viewModel.summary} />

      <div className={S.main}>
        <div className={S.winnersColumn}>
          <TeacherResultsWinners winners={viewModel.winners} />
        </div>
        <div className={S.standingsColumn}>
          <TeacherResultsStandings rows={viewModel.standings} />
        </div>
        <div className={S.awardsColumn}>
          <TeacherResultsAwards awards={viewModel.awards} />
        </div>
      </div>

      <TeacherResultsFooter onBackToRaces={onBackToRaces} />
    </section>
  );
}
