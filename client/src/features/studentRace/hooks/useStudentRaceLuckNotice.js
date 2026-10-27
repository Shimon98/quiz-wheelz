import { useEffect, useState } from "react";

import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { selectLuckClockFloor, selectLuckNotice, selectLuckNoticeChangeAt } from "../runtime/studentRaceGameplayMode";

// Luck news is a pure function of the server gameplay, the Luck event the moments pipeline announced and the clock.
// The clock wakes up once, when the told notice can change, and rests otherwise, so Luck OFF or an old history never
// wakes this line up.
export default function useStudentRaceLuckNotice(gameplay, announcedLuckEventId = null) {
  const [now, setNow] = useState(() => Date.now());
  const { luckNoticeMs } = STUDENT_RACE_CONFIG;
  const clock = Math.max(now, selectLuckClockFloor(gameplay));
  const changeAtEpochMs = selectLuckNoticeChangeAt(gameplay, clock, luckNoticeMs, announcedLuckEventId);

  useEffect(() => {
    if (changeAtEpochMs == null) return undefined;
    // A timer may fire a moment early; the clock still never reads before the change it waited for.
    const timeout = setTimeout(
      () => setNow(Math.max(Date.now(), changeAtEpochMs)),
      Math.max(0, changeAtEpochMs - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [changeAtEpochMs]);

  return selectLuckNotice(gameplay, clock, luckNoticeMs, announcedLuckEventId);
}
