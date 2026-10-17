import {
  QUESTION_GAMEPLAY_CONTEXTS,
  RACE_GAMEPLAY_EFFECT_SOURCES,
  RACE_GAMEPLAY_EFFECT_TYPES,
  RACE_GAMEPLAY_MODES,
} from "../../../constants/raceGameplayConstants.js";

const QUESTION_CONTEXT_BY_MODE = Object.freeze({
  [RACE_GAMEPLAY_MODES.NORMAL]: QUESTION_GAMEPLAY_CONTEXTS.NORMAL,
  [RACE_GAMEPLAY_MODES.TURBO_TRIAL]: QUESTION_GAMEPLAY_CONTEXTS.TURBO_TRIAL,
  [RACE_GAMEPLAY_MODES.SAFE_RUN]: QUESTION_GAMEPLAY_CONTEXTS.SAFE_RUN,
});

export function getQuestionContextForMode(mode) {
  return Object.hasOwn(QUESTION_CONTEXT_BY_MODE, mode) ? QUESTION_CONTEXT_BY_MODE[mode] : null;
}

export function isQuestionGameplayMode(mode) {
  return getQuestionContextForMode(mode) != null;
}

export function isQuestionForGameplayMode(question, mode) {
  return question != null && question.gameplayContext === getQuestionContextForMode(mode);
}

export function isChallengeChoiceMode(gameplay) {
  return gameplay?.mode === RACE_GAMEPLAY_MODES.CHALLENGE_CHOICE;
}

export function selectChallengeOffer(gameplay) {
  return isChallengeChoiceMode(gameplay) ? gameplay.challenge?.offer ?? null : null;
}

export function hasChallengeTimeoutSlowdown(gameplay) {
  return gameplay?.activeEffects?.some((effect) => effect.type === RACE_GAMEPLAY_EFFECT_TYPES.SPEED_SLOW
    && effect.source === RACE_GAMEPLAY_EFFECT_SOURCES.CHALLENGE_TIMEOUT) === true;
}
