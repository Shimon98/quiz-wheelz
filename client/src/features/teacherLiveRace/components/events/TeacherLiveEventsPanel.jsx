import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { useLanguageStore } from "../../../../stores/languageStore";
import { TEACHER_RACE_PROJECTOR_ART } from "../../assets/teacherRaceProjectorArt";
import {
  TEACHER_LIVE_FEED_CONFIG,
  TEACHER_FEED_ACCENT_PULSE,
} from "../../config/teacherLiveFeedConfig";
import useFreshFeedItem from "../../hooks/useFreshFeedItem";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";
import { resolveTeacherFeedRelativeTime } from "../../utils/resolveTeacherFeedRelativeTime";
import TeacherLiveEventItem from "./TeacherLiveEventItem";

const IDLE_ACCENT_KEY = "idle";

function formatRelativeTime(formatter, item, serverNowEpochMs) {
  const relative = resolveTeacherFeedRelativeTime(
    item.occurredAtEpochMs,
    serverNowEpochMs,
  );

  return relative == null ? null : formatter.format(relative.value, relative.unit);
}

export default function TeacherLiveEventsPanel({ items, serverNowEpochMs }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const reduce = useReducedMotion();
  const language = useLanguageStore((state) => state.language);
  const formatter = useMemo(
    () => new Intl.RelativeTimeFormat(language, { numeric: "auto" }),
    [language],
  );
  const freshItem = useFreshFeedItem(items);
  const pulse = freshItem && !reduce;
  const visibleItems = items.slice(0, TEACHER_LIVE_FEED_CONFIG.maxItems);

  return (
    <section className={S.panel} aria-label={t("feed.title")}>
      <h2 className={S.panelTitle}>
        <motion.img
          key={freshItem?.id ?? IDLE_ACCENT_KEY}
          className={S.panelTitleArt}
          src={TEACHER_RACE_PROJECTOR_ART.uiAccents.liveEventsBolt}
          alt=""
          aria-hidden="true"
          draggable={false}
          animate={pulse ? TEACHER_FEED_ACCENT_PULSE.animate : undefined}
          transition={pulse ? TEACHER_FEED_ACCENT_PULSE.transition : undefined}
          data-fresh-feed-item={freshItem?.id}
        />
        {t("feed.title")}
      </h2>
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
