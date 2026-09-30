import { Paper } from "@mantine/core";

import {
  STUDENT_RESULTS_FINAL_VIEW,
  STUDENT_RESULTS_GROUP_VIEW,
  STUDENT_RESULTS_WATCH_GROUPS,
} from "../../config/studentRaceResultsViewConfig";
import { STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";
import { resolveFinalRowStatus } from "../../utils/studentResultsPresentation";
import StudentResultsListSection from "./StudentResultsListSection";

function resolveBoardSections(model) {
  if (model.finalCohorts) {
    return [
      {
        key: "final",
        view: STUDENT_RESULTS_FINAL_VIEW,
        participants: model.finalCohorts.flatMap((cohort) => cohort.participants),
        statusOf: resolveFinalRowStatus,
      },
    ];
  }

  return STUDENT_RESULTS_WATCH_GROUPS.filter((group) => model.groups[group].length > 0).map((group) => {
    const view = STUDENT_RESULTS_GROUP_VIEW[group];

    return { key: group, view, participants: model.groups[group], statusOf: () => view.status };
  });
}

export default function StudentResultsStandings({ model, reducedMotion }) {
  return (
    <Paper withBorder radius="xl" p="md">
      <div className={S.board}>
        {resolveBoardSections(model).map((section) => (
          <StudentResultsListSection
            key={section.key}
            view={section.view}
            participants={section.participants}
            statusOf={section.statusOf}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </Paper>
  );
}
