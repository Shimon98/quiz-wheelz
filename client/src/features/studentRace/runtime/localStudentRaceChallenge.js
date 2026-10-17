import {
  RACE_CHALLENGE_CHOICES,
  RACE_GAMEPLAY_EFFECT_SOURCES,
  RACE_GAMEPLAY_EFFECT_TYPES,
  RACE_GAMEPLAY_MODES,
} from "../../../constants/raceGameplayConstants";

const DEV_CHALLENGE = Object.freeze({
  threshold: 100,
  energyPerCorrectAnswer: 25,
  offerMs: 12000,
  timeoutRestoreEnergy: 50,
  timeoutSlowdownMs: 4000,
  timeoutMagnitudeTenths: 1,
  questionsByChoice: Object.freeze({
    [RACE_CHALLENGE_CHOICES.TURBO_TRIAL]: 1,
    [RACE_CHALLENGE_CHOICES.SAFE_RUN]: 3,
  }),
});

function resolveDevOutcome(run) {
  if (run.type === RACE_CHALLENGE_CHOICES.TURBO_TRIAL) {
    return run.correctAnswers === run.totalQuestions ? "TURBO_SUCCESS" : "TURBO_FAILURE";
  }
  return run.correctAnswers === run.totalQuestions ? "SAFE_PERFECT" : "SAFE_COMPLETE";
}

export function createLocalStudentRaceChallenge() {
  let energy = 0;
  let offer = null;
  let run = null;
  let lastResult = null;
  let timeout = null;
  let nextId = 1;

  const isTimeoutSlowdownActive = (nowEpochMs) => timeout != null
    && nowEpochMs >= timeout.startsAtEpochMs && nowEpochMs < timeout.endsAtEpochMs;

  return {
    answer(correct, nowEpochMs) {
      if (offer != null) return;
      if (run != null) {
        run = { ...run, questionsResolved: run.questionsResolved + 1,
          correctAnswers: run.correctAnswers + (correct ? 1 : 0) };
        if (run.questionsResolved === run.totalQuestions) {
          lastResult = { challengeId: run.challengeId, type: run.type, outcome: resolveDevOutcome(run),
            questionsResolved: run.questionsResolved, correctAnswers: run.correctAnswers, completedAtEpochMs: nowEpochMs };
          run = null;
        }
        return;
      }
      if (!correct) return;
      energy = Math.min(DEV_CHALLENGE.threshold, energy + DEV_CHALLENGE.energyPerCorrectAnswer);
      if (energy === DEV_CHALLENGE.threshold && !isTimeoutSlowdownActive(nowEpochMs)) {
        offer = { offerId: nextId, expiresAtEpochMs: nowEpochMs + DEV_CHALLENGE.offerMs,
          choices: Object.values(RACE_CHALLENGE_CHOICES) };
        nextId += 1;
        energy = 0;
      }
    },
    choose(choice) {
      if (offer == null || !offer.choices.includes(choice)) return false;
      run = { challengeId: offer.offerId, type: choice, questionsResolved: 0,
        totalQuestions: DEV_CHALLENGE.questionsByChoice[choice], correctAnswers: 0 };
      offer = null;
      return true;
    },
    advanceTo(nowEpochMs) {
      if (offer == null || nowEpochMs < offer.expiresAtEpochMs) return;
      timeout = { startsAtEpochMs: offer.expiresAtEpochMs,
        endsAtEpochMs: offer.expiresAtEpochMs + DEV_CHALLENGE.timeoutSlowdownMs };
      offer = null;
      energy = DEV_CHALLENGE.timeoutRestoreEnergy;
    },
    mode() {
      if (offer != null) return RACE_GAMEPLAY_MODES.CHALLENGE_CHOICE;
      return run?.type ?? RACE_GAMEPLAY_MODES.NORMAL;
    },
    slowdownTenths(nowEpochMs) {
      return isTimeoutSlowdownActive(nowEpochMs) ? DEV_CHALLENGE.timeoutMagnitudeTenths : 0;
    },
    activeEffects(nowEpochMs) {
      return isTimeoutSlowdownActive(nowEpochMs) ? [{
        effectId: 1000 + nextId,
        type: RACE_GAMEPLAY_EFFECT_TYPES.SPEED_SLOW,
        source: RACE_GAMEPLAY_EFFECT_SOURCES.CHALLENGE_TIMEOUT,
        magnitudeTenths: DEV_CHALLENGE.timeoutMagnitudeTenths,
        ...timeout,
      }] : [];
    },
    snapshot() {
      return { energy, threshold: DEV_CHALLENGE.threshold, offer, run, lastResult };
    },
  };
}
