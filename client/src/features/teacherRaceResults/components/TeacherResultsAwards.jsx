import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ThemeIcon, VisuallyHidden } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { TEACHER_RESULTS_AWARD_PRESENTATION } from "../config/teacherRaceResultsConfig";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";

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
            const Icon = presentation.icon;

            return (
              <li key={award.type} className={S.awardCard} data-award-type={award.type}>
                <ThemeIcon variant="light" color={presentation.tone} size="lg" radius="xl">
                  <Icon size={20} aria-hidden="true" />
                </ThemeIcon>
                <span className={S.awardText}>
                  <span className={S.awardLabel}>{t(presentation.labelKey)}</span>
                  <span className={S.awardNames} title={award.namesLabel}>
                    {award.hiddenNameCount === 0 ? (
                      award.visibleNamesLabel
                    ) : (
                      <>
                        <span aria-hidden="true">
                          {t("awards.namesAndMore", {
                            names: award.visibleNamesLabel,
                            count: award.hiddenNameCount,
                          })}
                        </span>
                        <VisuallyHidden>{award.namesLabel}</VisuallyHidden>
                      </>
                    )}
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
