import { CircleCheck, CircleX, Flag, Flame, Target, Timer, Trophy, UserX, UsersRound } from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { RACE_RESULT_AWARD_TYPES } from "../../../constants/raceResultConstants";

export const TEACHER_RESULTS_SUMMARY_STATS = Object.freeze([
  { id: "participants", labelKey: "summary.participants", icon: UsersRound, tone: UI_TONES.INFO },
  { id: "finished", labelKey: "summary.finished", icon: Flag, tone: UI_TONES.SUCCESS },
  { id: "didNotFinish", labelKey: "summary.didNotFinish", icon: UserX, tone: UI_TONES.NEUTRAL },
  { id: "correctAnswers", labelKey: "summary.correctAnswers", icon: CircleCheck, tone: UI_TONES.SUCCESS },
  { id: "wrongAnswers", labelKey: "summary.wrongAnswers", icon: CircleX, tone: UI_TONES.DANGER },
  { id: "duration", labelKey: "summary.duration", icon: Timer, tone: UI_TONES.WARNING, valueDir: "ltr" },
]);

export const TEACHER_RESULTS_AWARD_PRESENTATION = Object.freeze({
  [RACE_RESULT_AWARD_TYPES.HIGHEST_SCORE]: {
    labelKey: "awards.highestScore",
    valueKey: "awards.points",
    icon: Trophy,
    tone: UI_TONES.WARNING,
  },
  [RACE_RESULT_AWARD_TYPES.MOST_CORRECT_ANSWERS]: {
    labelKey: "awards.mostCorrect",
    valueKey: "awards.answers",
    icon: Target,
    tone: UI_TONES.SUCCESS,
  },
  [RACE_RESULT_AWARD_TYPES.BEST_STREAK]: {
    labelKey: "awards.bestStreak",
    valueKey: "awards.streak",
    icon: Flame,
    tone: UI_TONES.DANGER,
  },
});

export const TEACHER_RESULTS_AWARD_VISIBLE_NAMES = 2;

export const TEACHER_RESULTS_WINNER_ENTRANCE = Object.freeze({
  initial: Object.freeze({ scale: 0.85, opacity: 0, y: 12 }),
  animate: Object.freeze({ scale: 1, opacity: 1, y: 0 }),
  transition: Object.freeze({ type: "spring", stiffness: 240, damping: 18 }),
});
