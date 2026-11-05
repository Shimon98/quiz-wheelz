import { useEffect, useState } from "react";

import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { selectLuckClockFloor, selectLuckNotice, selectLuckNoticeChangeAt } from "../runtime/studentRaceGameplayMode";

// Luck news is a pure function of the server gameplay, the Luck event the moments pipeline announced and the clock.
// The clock wakes up once, when the told notice can change, and rests otherwise, so Luck OFF or an old history never
// wakes this line up.
// C5-05: rank news (a climb the moments pipeline told, stamped once when it arrived) shares the line. Luck holds it
// first; the rank is told only inside its own short time, so it never comes back after Luck once that time is over.
export default function useStudentRaceLuckNotice(gameplay, announcedLuckEventId = null, rankNews = null) {
  const [now, setNow] = useState(() => Date.now());
  const { luckNoticeMs, rankNoticeMs } = STUDENT_RACE_CONFIG;
  const rankUntilEpochMs = rankNews == null ? null : rankNews.announcedAtEpochMs + rankNoticeMs;
  // Rank news arrived on this device's clock, so its arrival is a floor too for a clock that rested through quiet.
  const clock = Math.max(now, selectLuckClockFloor(gameplay), rankNews?.announcedAtEpochMs ?? 0);
  const changes = [selectLuckNoticeChangeAt(gameplay, clock, luckNoticeMs, announcedLuckEventId), rankUntilEpochMs]
    .filter((changeAtEpochMs) => changeAtEpochMs != null && changeAtEpochMs > clock);
  const changeAtEpochMs = changes.length === 0 ? null : Math.min(...changes);

  useEffect(() => {
    if (changeAtEpochMs == null) return undefined;
    // A timer may fire a moment early; the clock still never reads before the change it waited for.
    const timeout = setTimeout(
      () => setNow(Math.max(Date.now(), changeAtEpochMs)),
      Math.max(0, changeAtEpochMs - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [changeAtEpochMs]);

  const luckNotice = selectLuckNotice(gameplay, clock, luckNoticeMs, announcedLuckEventId);
  if (luckNotice != null) return luckNotice;
  return rankUntilEpochMs != null && clock < rankUntilEpochMs ? rankNews.type : null;
}
