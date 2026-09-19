import { useTranslation } from "react-i18next";
import { ThemeIcon } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { TEACHER_FEED_PRESENTATION } from "../../config/teacherLiveFeedConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";

export default function TeacherLiveEventItem({ item, relativeLabel }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const presentation = TEACHER_FEED_PRESENTATION[item.kind];
  const KindIcon = presentation?.icon;

  return (
    <li className={S.eventItem} data-feed-kind={item.kind}>
      {KindIcon ? (
        <ThemeIcon variant="light" color={presentation.tone} size="md" radius="xl">
          <KindIcon size={16} aria-hidden="true" />
        </ThemeIcon>
      ) : null}
      <div>
        <div className={S.eventText}>{t(item.messageKey, item.values)}</div>
        {relativeLabel ? <div className={S.eventTime}>{relativeLabel}</div> : null}
      </div>
    </li>
  );
}
