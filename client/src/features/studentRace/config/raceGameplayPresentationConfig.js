import { ShieldCheck, Zap } from "lucide-react";

import { RACE_GAMEPLAY_MODES } from "../../../constants/raceGameplayConstants";
import { RACE_CHALLENGE_ART } from "./raceChallengeArt";

export const RACE_GAMEPLAY_PRESENTATION = Object.freeze({
  [RACE_GAMEPLAY_MODES.TURBO_TRIAL]: Object.freeze({
    icon: Zap,
    emblemArt: RACE_CHALLENGE_ART.turboEmblem,
    titleKey: "gameplay.turbo.title",
    descriptionKey: "gameplay.turbo.description",
    kartAura: Object.freeze({ color: 0xf5a623, alpha: 0.85, pulsePeriodMs: 800 }),
  }),
  [RACE_GAMEPLAY_MODES.SAFE_RUN]: Object.freeze({
    icon: ShieldCheck,
    emblemArt: RACE_CHALLENGE_ART.safeEmblem,
    titleKey: "gameplay.safe.title",
    descriptionKey: "gameplay.safe.description",
    kartAura: Object.freeze({ color: 0x4fa6e8, alpha: 0.65, pulsePeriodMs: null }),
  }),
});

export function getRaceGameplayPresentation(key) {
  return Object.hasOwn(RACE_GAMEPLAY_PRESENTATION, key) ? RACE_GAMEPLAY_PRESENTATION[key] : null;
}
