import { Clock, Flag, KeyRound, Timer, UsersRound, WifiOff } from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import {
  RACE_PLAYER_STATUSES,
  RACE_STATUSES,
} from "../../../constants/raceStatusConstants";

export const TRACK_SIGN_KINDS = Object.freeze({
  START: "start",
  FINISH: "finish",
});

export const TEACHER_RACE_PROJECTOR_CONFIG = Object.freeze({
  vehicleTweenMs: 1000,
  leaderboardLayoutMs: 320,
  leaderboardLayoutEase: "easeOut",
  brandShuffleIntervalMs: 30_000,
  progressMarkers: Object.freeze([
    { value: 0, compact: true },
    { value: 25, compact: false },
    { value: 50, compact: true },
    { value: 75, compact: false },
    { value: 100, compact: true },
  ]),
  laneGeometry: Object.freeze({
    vehicleAspectRatio: 384 / 226,
    compactVehicleHeightRem: 2.5,
    wideVehicleHeightRem: 2.75,
    vehicleEdgeGapRem: 0.25,
  }),
  signBoards: Object.freeze({
    [TRACK_SIGN_KINDS.START]: Object.freeze({
      aspectRatio: 640 / 616,
      textBox: Object.freeze({ left: 31.8, top: 31.12, width: 55.91, height: 16.23 }),
    }),
    [TRACK_SIGN_KINDS.FINISH]: Object.freeze({
      aspectRatio: 640 / 626,
      textBox: Object.freeze({ left: 12.22, top: 31.31, width: 55.91, height: 16.49 }),
    }),
  }),
  titleBadge: Object.freeze({
    aspectRatio: 1024 / 329,
    sliceLeftPx: 536,
    sliceRightPx: 450,
    capLeft: 1.6292,
    capRight: 1.3678,
    textPadLeft: 0.7964,
    textPadRight: 0.7538,
    textShift: 0.0972,
    fontScale: 0.3,
  }),
});

export const TEACHER_LEADERBOARD_RANK_TIERS = Object.freeze({
  1: "first",
  2: "second",
  3: "third",
});

export const TEACHER_LEADERBOARD_DEFAULT_TIER = "none";

export const TEACHER_LEADERBOARD_TIER_MEDALS = Object.freeze({
  first: "gold",
  second: "silver",
  third: "bronze",
});

export const TEACHER_RACE_STATUS_PRESENTATION = Object.freeze({
  [RACE_STATUSES.IN_PROGRESS]: {
    labelKey: "header.live",
    tone: UI_TONES.SUCCESS,
  },
  [RACE_STATUSES.FINISHED]: {
    labelKey: "header.finished",
    tone: UI_TONES.INFO,
  },
});

export const TEACHER_HEADER_STATS = Object.freeze([
  {
    id: "elapsed",
    labelKey: "stats.elapsed",
    icon: Timer,
    tone: UI_TONES.INFO,
    valueDir: "ltr",
  },
  {
    id: "participants",
    labelKey: "stats.participants",
    icon: UsersRound,
    tone: UI_TONES.SUCCESS,
    valueDir: undefined,
  },
  {
    id: "roomCode",
    labelKey: "stats.roomCode",
    icon: KeyRound,
    tone: UI_TONES.WARNING,
    valueDir: "ltr",
  },
]);

export const TEACHER_PLAYER_STATUS_PRESENTATION = Object.freeze({
  [RACE_PLAYER_STATUSES.WAITING]: {
    labelKey: "playerStatus.waiting",
    icon: Clock,
    muted: true,
  },
  [RACE_PLAYER_STATUSES.RACING]: {
    labelKey: "playerStatus.racing",
    icon: null,
    muted: false,
  },
  [RACE_PLAYER_STATUSES.FINISHED]: {
    labelKey: "playerStatus.finished",
    icon: Flag,
    muted: false,
  },
  [RACE_PLAYER_STATUSES.DISCONNECTED]: {
    labelKey: "playerStatus.disconnected",
    icon: WifiOff,
    muted: true,
  },
});
