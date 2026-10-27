import {
  QUESTION_GAMEPLAY_CONTEXTS,
  RACE_GAMEPLAY_EFFECT_SOURCES,
  RACE_GAMEPLAY_EFFECT_TYPES,
  RACE_GAMEPLAY_MODES,
  RACE_LUCK_EVENT_TYPES,
} from "../../../constants/raceGameplayConstants.js";
import { luckMomentTypeOf } from "./deriveStudentRaceMoments.js";
import { STUDENT_RACE_MOMENT } from "./studentRaceRuntimeConstants.js";

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

// The server turns a Tailwind into a speed boost and a Mud Splash into a slowdown, both from the Luck source.
const LUCK_TYPE_BY_EFFECT_TYPE = Object.freeze({
  [RACE_GAMEPLAY_EFFECT_TYPES.SPEED_BOOST]: RACE_LUCK_EVENT_TYPES.TAILWIND,
  [RACE_GAMEPLAY_EFFECT_TYPES.SPEED_SLOW]: RACE_LUCK_EVENT_TYPES.MUD_SPLASH,
});

// Judged on the server clock of the snapshot that carried the effect, so a window ends on time between snapshots.
export function isGameplayEffectActiveAt(effect, clientNowEpochMs) {
  const serverNowEpochMs = clientNowEpochMs + effect.serverClockOffsetMs;
  return serverNowEpochMs >= effect.startsAtEpochMs && serverNowEpochMs < effect.endsAtEpochMs;
}

function luckWindowsOf(gameplay) {
  return (gameplay?.activeEffects ?? []).filter((effect) => effect.source === RACE_GAMEPLAY_EFFECT_SOURCES.LUCK_EVENT
    && Object.hasOwn(LUCK_TYPE_BY_EFFECT_TYPE, effect.type));
}

// Names the Luck event behind an active Luck speed window; display only, the server owns the speed.
export function selectActiveLuckEffect(gameplay, clientNowEpochMs) {
  const effect = luckWindowsOf(gameplay).find((candidate) => isGameplayEffectActiveAt(candidate, clientNowEpochMs));
  return effect == null ? null : LUCK_TYPE_BY_EFFECT_TYPE[effect.type];
}

const LUCK_WINDOW_NOTICES = Object.freeze({
  [RACE_LUCK_EVENT_TYPES.TAILWIND]: STUDENT_RACE_MOMENT.LUCK_TAILWIND,
  [RACE_LUCK_EVENT_TYPES.MUD_SPLASH]: STUDENT_RACE_MOMENT.LUCK_MUD,
});
const WINDOW_NOTICES = new Set(Object.values(LUCK_WINDOW_NOTICES));

// One-shot news (an Energy Orb or a shield block) is the newest event, told for newsMs after the server decided it,
// and only when the moments pipeline announced that event on this screen: a refresh or a reconnect starts from a
// baseline that announces nothing, so news is never told twice. A window event is told by its window instead.
function luckNewsOf(gameplay, newsMs, announcedLuckEventId) {
  const event = gameplay?.luck?.recentEvents?.at(-1);
  if (event == null || event.eventId !== announcedLuckEventId) return null;
  const notice = luckMomentTypeOf(event);
  // An event that cannot be dated (no clock offset) ends at NaN, so it is never told.
  return WINDOW_NOTICES.has(notice) ? null
    : { notice, untilEpochMs: event.occurredAtEpochMs + newsMs - event.serverClockOffsetMs };
}

// Every Luck event happened before the snapshot that carries it left the server, so its instant on this device's clock
// is a floor for a clock that slept through a quiet stretch (the notice line wakes up only for changes).
export function selectLuckClockFloor(gameplay) {
  const instants = (gameplay?.luck?.recentEvents ?? [])
    .map((event) => event.occurredAtEpochMs - event.serverClockOffsetMs)
    .filter(Number.isFinite);
  return instants.length === 0 ? 0 : Math.max(...instants);
}

// The Luck news to tell now: an open speed window for as long as it lasts (it survives a refresh, like the window
// itself), otherwise announced one-shot news while it is fresh.
export function selectLuckNotice(gameplay, clientNowEpochMs, newsMs, announcedLuckEventId = null) {
  const openWindow = selectActiveLuckEffect(gameplay, clientNowEpochMs);
  if (openWindow != null) return LUCK_WINDOW_NOTICES[openWindow];
  const news = luckNewsOf(gameplay, newsMs, announcedLuckEventId);
  return news != null && clientNowEpochMs < news.untilEpochMs ? news.notice : null;
}

// The next client time the notice can change, so the screen wakes up once instead of ticking: a window closing (or
// opening, judged on a clock read before the window arrived), or news running out. Null: nothing left to wait for.
export function selectLuckNoticeChangeAt(gameplay, clientNowEpochMs, newsMs, announcedLuckEventId = null) {
  const windowEdges = luckWindowsOf(gameplay).flatMap(({ startsAtEpochMs, endsAtEpochMs, serverClockOffsetMs }) => [
    startsAtEpochMs - serverClockOffsetMs,
    endsAtEpochMs - serverClockOffsetMs,
  ]);
  const changes = [...windowEdges, luckNewsOf(gameplay, newsMs, announcedLuckEventId)?.untilEpochMs]
    .filter((changeAtEpochMs) => changeAtEpochMs > clientNowEpochMs);
  return changes.length === 0 ? null : Math.min(...changes);
}

// Only the charges say whether a shield is up: the award question is history.
export function hasGuardShield(gameplay) {
  return (gameplay?.powerUps?.guardShieldCharges ?? 0) > 0;
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
