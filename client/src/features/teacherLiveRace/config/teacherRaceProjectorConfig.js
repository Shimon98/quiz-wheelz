import { Clock, Flag, KeyRound, Timer, UsersRound, WifiOff } from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import {
  RACE_PLAYER_STATUSES,
  RACE_STATUSES,
} from "../../../constants/raceStatusConstants";

export const TEACHER_RACE_PROJECTOR_CONFIG = Object.freeze({
  vehicleTweenMs: 1000,
  leaderboardLayoutMs: 400,
  progressMarkers: Object.freeze([
    { value: 0, compact: true },
    { value: 25, compact: false },
    { value: 50, compact: true },
    { value: 75, compact: false },
    { value: 100, compact: true },
  ]),
  laneGeometry: Object.freeze({
    vehicleWidthRem: 3,
    vehicleHeightRem: 1.5,
    railInsetRem: 1.5,
  }),
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
