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

// Challenge answers never touch the server streak, so they must not be presented as a combo.
const CHALLENGE_QUESTION_CONTEXTS = new Set([QUESTION_GAMEPLAY_CONTEXTS.TURBO_TRIAL, QUESTION_GAMEPLAY_CONTEXTS.SAFE_RUN]);

export function isChallengeAnswer(feedback) {
  return CHALLENGE_QUESTION_CONTEXTS.has(feedback?.gameplayContext);
}

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

const CHALLENGE_SLOWDOWN_SOURCES = new Set([
  RACE_GAMEPLAY_EFFECT_SOURCES.CHALLENGE_TIMEOUT,
  RACE_GAMEPLAY_EFFECT_SOURCES.TURBO_FAILURE,
]);

// Names the challenge behind an active server slowdown; any other slowdown stays unexplained.
export function selectChallengeSlowdownSource(gameplay) {
  return gameplay?.activeEffects?.find((effect) => effect.type === RACE_GAMEPLAY_EFFECT_TYPES.SPEED_SLOW
    && CHALLENGE_SLOWDOWN_SOURCES.has(effect.source))?.source ?? null;
}

// A challenge question's answer feedback names the server outcome once its run has ended.
export function selectChallengeResultOutcome(gameplay, questionContext) {
  const lastResult = gameplay?.challenge?.lastResult;
  if (questionContext == null || questionContext === QUESTION_GAMEPLAY_CONTEXTS.NORMAL
    || gameplay?.mode === questionContext || lastResult?.type !== questionContext) {
    return null;
  }
  return lastResult.outcome;
}

// Safe progress comes only from the server run: the shown question is the next unresolved one.
export function selectSafeRunProgress(gameplay, questionContext) {
  const run = gameplay?.challenge?.run;
  if (gameplay?.mode !== RACE_GAMEPLAY_MODES.SAFE_RUN || questionContext !== QUESTION_GAMEPLAY_CONTEXTS.SAFE_RUN
    || run?.type !== RACE_GAMEPLAY_MODES.SAFE_RUN || run.questionsResolved >= run.totalQuestions) {
    return null;
  }
  return { current: run.questionsResolved + 1, total: run.totalQuestions, resolved: run.questionsResolved };
}
