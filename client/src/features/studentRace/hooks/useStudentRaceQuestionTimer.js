import { useEffect, useState } from "react";

import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { getStudentRaceTimerModel } from "../utils/getStudentRaceTimerModel";

export function useStudentRaceQuestionTimer(question) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, STUDENT_RACE_CONFIG.timer.tickMs);
    return () => clearInterval(interval);
  }, []);

  return getStudentRaceTimerModel(question, now);
}
