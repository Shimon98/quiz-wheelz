import { BatteryCharging, Droplets, ShieldCheck, Wind, Zap } from "lucide-react";

import {
  RACE_CHALLENGE_OUTCOMES,
  RACE_GAMEPLAY_EFFECT_SOURCES,
  RACE_GAMEPLAY_MODES,
} from "../../../constants/raceGameplayConstants";
import { STUDENT_RACE_MOMENT } from "../runtime/studentRaceRuntimeConstants";
import { KART_THRUSTER_PALETTES } from "./kartThrusterConfig";
import { RACE_CHALLENGE_ART } from "./raceChallengeArt";

export const RACE_GAMEPLAY_PRESENTATION = Object.freeze({
  [RACE_GAMEPLAY_MODES.TURBO_TRIAL]: Object.freeze({
    icon: Zap,
    emblemArt: RACE_CHALLENGE_ART.turboEmblem,
    titleKey: "gameplay.turbo.title",
    descriptionKey: "gameplay.turbo.description",
    kartAura: Object.freeze({ color: 0xc98542, alpha: 0.12, pulsePeriodMs: null }),
    kartThrusters: null,
  }),
  [RACE_GAMEPLAY_MODES.SAFE_RUN]: Object.freeze({
    icon: ShieldCheck,
    emblemArt: RACE_CHALLENGE_ART.safeEmblem,
    titleKey: "gameplay.safe.title",
    descriptionKey: "gameplay.safe.description",
    kartAura: Object.freeze({ color: 0x4fa6e8, alpha: 0.18, pulsePeriodMs: null }),
    kartThrusters: KART_THRUSTER_PALETTES.safe,
  }),
});

export function getRaceGameplayPresentation(key) {
  return Object.hasOwn(RACE_GAMEPLAY_PRESENTATION, key) ? RACE_GAMEPLAY_PRESENTATION[key] : null;
}

const CHALLENGE_SLOWDOWN_NOTICE_KEYS = Object.freeze({
  [RACE_GAMEPLAY_EFFECT_SOURCES.CHALLENGE_TIMEOUT]: "gameplay.slowdownNotice",
  [RACE_GAMEPLAY_EFFECT_SOURCES.TURBO_FAILURE]: "gameplay.turboSlowdownNotice",
});

export function getChallengeSlowdownNoticeKey(source) {
  return Object.hasOwn(CHALLENGE_SLOWDOWN_NOTICE_KEYS, source) ? CHALLENGE_SLOWDOWN_NOTICE_KEYS[source] : null;
}

const CHALLENGE_RESULT_FEEDBACK_KEYS = Object.freeze({
  [RACE_CHALLENGE_OUTCOMES.TURBO_SUCCESS]: "gameplay.result.turboSuccess",
  [RACE_CHALLENGE_OUTCOMES.TURBO_FAILURE]: "gameplay.result.turboFailure",
  [RACE_CHALLENGE_OUTCOMES.SAFE_COMPLETE]: "gameplay.result.safeComplete",
  [RACE_CHALLENGE_OUTCOMES.SAFE_PERFECT]: "gameplay.result.safePerfect",
});

export function getChallengeResultFeedbackKey(outcome) {
  return Object.hasOwn(CHALLENGE_RESULT_FEEDBACK_KEYS, outcome) ? CHALLENGE_RESULT_FEEDBACK_KEYS[outcome] : null;
}

// Luck news for the question panel's notice line; Mud is the one setback among them.
const LUCK_NOTICES = Object.freeze({
  [STUDENT_RACE_MOMENT.LUCK_TAILWIND]: Object.freeze({
    icon: Wind, messageKey: "gameplay.luck.tailwind", tone: "good",
  }),
  [STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB]: Object.freeze({
    icon: BatteryCharging, messageKey: "gameplay.luck.energyOrb", tone: "good",
  }),
  [STUDENT_RACE_MOMENT.LUCK_MUD]: Object.freeze({ icon: Droplets, messageKey: "gameplay.luck.mud", tone: "setback" }),
  [STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED]: Object.freeze({
    icon: ShieldCheck, messageKey: "gameplay.luck.shieldBlocked", tone: "good",
  }),
});

export function getLuckNoticePresentation(notice) {
  return Object.hasOwn(LUCK_NOTICES, notice) ? LUCK_NOTICES[notice] : null;
}
