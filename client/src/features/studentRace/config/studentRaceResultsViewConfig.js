import { Flag, Hourglass, LogOut, Timer, Trophy } from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme.js";
import { STUDENT_RESULT_GROUPS } from "./studentRaceResultsConfig.js";

export const STUDENT_RESULTS_WATCH_GROUPS = Object.freeze([
  STUDENT_RESULT_GROUPS.RANKED,
  STUDENT_RESULT_GROUPS.CONFIRMING,
  STUDENT_RESULT_GROUPS.RACING,
  STUDENT_RESULT_GROUPS.OUT,
]);

export const STUDENT_RESULTS_GROUP_VIEW = Object.freeze({
  [STUDENT_RESULT_GROUPS.RANKED]: Object.freeze({
    titleKey: "results.groupRanked",
    headingIcon: Flag,
    ordered: true,
    status: null,
  }),
  [STUDENT_RESULT_GROUPS.CONFIRMING]: Object.freeze({
    titleKey: "results.groupConfirming",
    headingIcon: Hourglass,
    ordered: false,
    status: Object.freeze({ labelKey: "results.statusConfirming", icon: Hourglass, muted: false }),
  }),
  [STUDENT_RESULT_GROUPS.RACING]: Object.freeze({
    titleKey: "results.groupRacing",
    headingIcon: Timer,
    ordered: false,
    status: Object.freeze({ labelKey: "results.statusRacing", icon: Timer, muted: false }),
  }),
  [STUDENT_RESULT_GROUPS.OUT]: Object.freeze({
    titleKey: "results.groupOut",
    headingIcon: LogOut,
    ordered: false,
    status: Object.freeze({ labelKey: "results.statusOut", icon: LogOut, muted: true }),
  }),
});

export const STUDENT_RESULTS_FINAL_VIEW = Object.freeze({
  titleKey: "results.finalStandings",
  headingIcon: Trophy,
  ordered: true,
});

export const STUDENT_RESULTS_TITLE_PLAQUE = Object.freeze({
  aspectRatio: 512 / 223,
  fontScale: 0.19,
  textBox: Object.freeze({ left: 23.4, top: 36.79, width: 52.4, height: 34.13 }),
});

export const STUDENT_RESULTS_DID_NOT_FINISH = Object.freeze({
  labelKey: "results.statusDidNotFinish",
  icon: Flag,
  muted: true,
});

export const STUDENT_RESULTS_HERO_BADGES = Object.freeze({ RANK: "rank", PENDING: "pending" });

export const STUDENT_RESULTS_SEGMENT_TONES = Object.freeze({
  finished: UI_TONES.SUCCESS,
  racing: UI_TONES.INFO,
  out: UI_TONES.NEUTRAL,
});

export const STUDENT_RESULTS_MOTION = Object.freeze({
  row: Object.freeze({ duration: 0.28, ease: "easeOut" }),
  instant: Object.freeze({ duration: 0 }),
  enter: Object.freeze({
    initial: Object.freeze({ opacity: 0, y: 12 }),
    animate: Object.freeze({ opacity: 1, y: 0 }),
    transition: Object.freeze({ duration: 0.25, ease: "easeOut" }),
  }),
});
