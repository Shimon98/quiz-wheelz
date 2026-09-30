import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";
import StudentResultRow from "./StudentResultRow";

export default function StudentResultsListSection({ view, participants, statusOf, reducedMotion }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const titleId = useId();
  const List = view.ordered ? "ol" : "ul";
  const HeadingIcon = view.headingIcon;

  return (
    <section className={S.group} aria-labelledby={titleId}>
      <Title order={2} size="h5" id={titleId}>
        <span className={S.groupTitle}>
          <span className={S.groupIcon} aria-hidden="true">
            <HeadingIcon size={16} />
          </span>
          {t(view.titleKey)}
        </span>
      </Title>
      <List role="list" className={S.list}>
        {participants.map((participant) => (
          <StudentResultRow
            key={participant.racePlayerId}
            participant={participant}
            status={statusOf(participant)}
            reducedMotion={reducedMotion}
          />
        ))}
      </List>
    </section>
  );
}
