import { useId } from "react";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { TEACHER_RESULTS_AWARD_PRESENTATION } from "../config/teacherRaceResultsConfig";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";
import { RESULT_NAME_PART } from "../utils/formatResultNameList";

function TeacherResultsAwardNames({ parts }) {
  return parts.map((part, index) =>
    part.type === RESULT_NAME_PART ? (
      <bdi key={index} className={S.awardName}>
        {part.value}
      </bdi>
    ) : (
      <span key={index} className={S.awardNameGlue}>
        {part.value}
      </span>
    ),
  );
}

export default function TeacherResultsAwards({ awards }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);
  const titleId = useId();

  return (
    <section className={S.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={S.panelTitle}>
        {t("awards.title")}
      </h2>
      {awards.length === 0 ? (
        <p className={S.emptyText}>{t("awards.none")}</p>
      ) : (
        <ul className={S.awardList}>
          {awards.map((award) => {
            const presentation = TEACHER_RESULTS_AWARD_PRESENTATION[award.type];
            const compacted = award.hiddenNameCount > 0;

            return (
              <li key={award.type} className={S.awardCard} data-award-type={award.type}>
                <span className={S.awardLead}>
                  <img className={S.awardArt} src={presentation.art} alt="" aria-hidden="true" draggable={false} />
                </span>
                <span className={S.awardText}>
                  <span className={S.awardLabel}>{t(presentation.labelKey)}</span>
                  <span className={S.awardNames} title={award.namesLabel}>
                    <span className={S.awardNameList} aria-hidden={compacted ? "true" : undefined}>
                      <TeacherResultsAwardNames parts={award.visibleNameParts} />
                      {compacted ? (
                        <>
                          <span className={S.awardNameGlue}>{" "}</span>
                          <span className={S.awardNameMore}>
                            {t("awards.andMore", { count: award.hiddenNameCount })}
                          </span>
                        </>
                      ) : null}
                    </span>
                    {compacted ? <VisuallyHidden>{award.namesLabel}</VisuallyHidden> : null}
                  </span>
                  <span className={S.awardValue}>{t(presentation.valueKey, { count: award.value })}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
