import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { getLuckNoticePresentation } from "../config/raceGameplayPresentationConfig";
import useStudentRaceLuckNotice from "../hooks/useStudentRaceLuckNotice";
import { STUDENT_RACE_PANEL_STYLES } from "../styles/studentRacePanelStyles";

// Luck has its own line for the whole race: the question card's status line first shows the answer feedback and then
// "loading the next question", so a notice waiting there was seen late or expired unseen. The live region is always in
// the page, so a screen reader announces each notice once, when it appears.
export default function StudentRaceLuckNotice({ gameplay = null, announcedLuckEventId = null }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const notice = getLuckNoticePresentation(useStudentRaceLuckNotice(gameplay, announcedLuckEventId));
  const LuckIcon = notice?.icon;

  return (
    <div aria-live="polite" aria-atomic="true" className="flex justify-center px-4">
      {notice != null ? (
        <p data-tone={notice.tone}
          className={`race-luck-notice ${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text)]`}>
          <LuckIcon aria-hidden="true" className="race-luck-notice-icon size-4 shrink-0" />
          <span>{t(notice.messageKey)}</span>
        </p>
      ) : null}
    </div>
  );
}
