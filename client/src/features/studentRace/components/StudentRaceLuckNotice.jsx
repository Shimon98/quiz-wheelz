import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import MomentArtIcon from "../../../shared/raceMoments/MomentArtIcon";
import { getRaceNoticePresentation } from "../config/raceGameplayPresentationConfig";
import useStudentRaceLuckNotice from "../hooks/useStudentRaceLuckNotice";
import { STUDENT_RACE_PANEL_STYLES } from "../styles/studentRacePanelStyles";

// Luck has its own line for the whole race: the question card's status line first shows the answer feedback and then
// "loading the next question", so a notice waiting there was seen late or expired unseen. The live region is always in
// the page, so a screen reader announces each notice once, when it appears.
// C5-05: a climb in place is told on this same line (Luck first), so the race keeps one polite live region.
export default function StudentRaceLuckNotice({ gameplay = null, announcedLuckEventId = null, rankNews = null }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const notice = getRaceNoticePresentation(useStudentRaceLuckNotice(gameplay, announcedLuckEventId, rankNews));
  const NoticeIcon = notice?.icon;

  return (
    <div aria-live="polite" aria-atomic="true" className="flex justify-center px-4">
      {notice != null ? (
        <p data-tone={notice.tone}
          className={`race-luck-notice ${STUDENT_RACE_PANEL_STYLES.statusLine} text-[var(--qw-text)]`}>
          {/* 20 px keeps the line its 32 px height (measured 2026-11-07); the drawn fallback stays 16 px. */}
          <MomentArtIcon
            art={notice.art}
            className="size-5 shrink-0 object-contain"
            fallback={<NoticeIcon aria-hidden="true" className="race-luck-notice-icon size-4 shrink-0" />}
          />
          <span>{t(notice.messageKey, { rank: rankNews?.rank })}</span>
        </p>
      ) : null}
    </div>
  );
}
