import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { useLanguageStore } from "../../../../stores/languageStore";
import { TEACHER_LIVE_FEED_CONFIG } from "../../config/teacherLiveFeedConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";
import { resolveTeacherFeedRelativeTime } from "../../utils/resolveTeacherFeedRelativeTime";
import TeacherLiveEventItem from "./TeacherLiveEventItem";

function formatRelativeTime(formatter, item, serverNowEpochMs) {
  const relative = resolveTeacherFeedRelativeTime(
    item.occurredAtEpochMs,
    serverNowEpochMs,
  );

  return relative == null ? null : formatter.format(relative.value, relative.unit);
}

export default function TeacherLiveEventsPanel({ items, serverNowEpochMs }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const language = useLanguageStore((state) => state.language);
  const formatter = useMemo(
    () => new Intl.RelativeTimeFormat(language, { numeric: "auto" }),
    [language],
  );
  const visibleItems = items.slice(0, TEACHER_LIVE_FEED_CONFIG.maxItems);

  return (
    <section className={S.panel} aria-label={t("feed.title")}>
      <h2 className={S.panelTitle}>{t("feed.title")}</h2>
      {visibleItems.length === 0 ? (
        <p className={S.eventsEmpty}>{t("feed.empty")}</p>
      ) : null}
      <ul className={S.eventsList} role="log" aria-live="polite">
        {visibleItems.map((item) => (
          <TeacherLiveEventItem
            key={item.id}
            item={item}
            relativeLabel={formatRelativeTime(formatter, item, serverNowEpochMs)}
          />
        ))}
      </ul>
    </section>
  );
}
