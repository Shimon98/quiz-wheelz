import { AlertTriangle, Flag, RefreshCw, Wifi, WifiOff } from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { TEACHER_CONNECTION_STATES } from "../runtime/teacherRaceLiveConstants";

export const TEACHER_RACE_LIVE_CONFIG = Object.freeze({
  recovery: Object.freeze({
    initialDelayMs: 1000,
    factor: 2,
    maxDelayMs: 15000,
    jitterMs: 300,
    nativeReconnectGraceMs: 8000,
  }),
  elapsedTickMs: 1000,
});

export const TEACHER_CONNECTION_PRESENTATION = Object.freeze({
  [TEACHER_CONNECTION_STATES.CONNECTING]: {
    labelKey: "connection.connecting",
    icon: RefreshCw,
    tone: UI_TONES.INFO,
  },
  [TEACHER_CONNECTION_STATES.LIVE]: {
    labelKey: "connection.live",
    icon: Wifi,
    tone: UI_TONES.SUCCESS,
  },
  [TEACHER_CONNECTION_STATES.RECOVERING]: {
    labelKey: "connection.recovering",
    icon: RefreshCw,
    tone: UI_TONES.WARNING,
  },
  [TEACHER_CONNECTION_STATES.OFFLINE]: {
    labelKey: "connection.offline",
    icon: WifiOff,
    tone: UI_TONES.DANGER,
  },
  [TEACHER_CONNECTION_STATES.ENDED]: {
    labelKey: "connection.ended",
    icon: Flag,
    tone: UI_TONES.NEUTRAL,
  },
  [TEACHER_CONNECTION_STATES.ERROR]: {
    labelKey: "connection.error",
    icon: AlertTriangle,
    tone: UI_TONES.DANGER,
  },
});
