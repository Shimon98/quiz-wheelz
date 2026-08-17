import { STUDENT_RACE_FEEDBACK } from "./studentRaceRuntimeConstants.js";

/**
 * THE state contract of the student race screen. Every data source — REST
 * responses, submit-answer raceImpact, the temporary local runtime, future
 * SSE snapshots — is mapped (runtime/map*.js) into this exact shape; the
 * page, HUD and Pixi renderer consume it without knowing the source.
 *
 * Race-level fields and totalDistance start as null on purpose: the client
 * never pretends to know what the server hasn't said yet (no fake
 * IN_PROGRESS, no fake track length — the finish-line UI simply waits).
 * `visual` carries TARGETS only; frame-interpolated values (visualPosition,
 * camera, world offset) live inside the Pixi renderer, never here (README).
 *
 * @typedef {Object} StudentRaceRuntimeState
 * @property {{id: ?number, title: string, roomCode: string, startedAt: ?string,
 *   finishedAt: ?string}} race       Server race metadata (mapRaceStateToRuntime)
 * @property {?string} raceStatus     Server RaceStatus name (null until known)
 * @property {?string} playerStatus   Server RacePlayerStatus name (null until known)
 * @property {boolean} playerFinished Authoritative server flag — never derived locally
 * @property {boolean} raceFinished   Authoritative server flag — never derived locally
 * @property {?number} totalDistance  Track length in server units (null until known)
 * @property {{position: number, speed: number, score: number, streak: number,
 *   highestStreak: number, currentDifficulty: ?string}} player
 * @property {{questionId: ?number, questionText: string, timeLimitSeconds: number,
 *   expiresAt: ?string, choices: Array<Object>}} question
 * @property {{isSubmitting: boolean, selectedChoiceId: ?number, correct: ?boolean,
 *   correctAnswerChoiceId: ?number, feedbackState: string}} answer
 * @property {{targetPosition: number, targetSpeed: number, activeEffect: ?string}} visual
 * @property {{assets: boolean, raceState: boolean, question: boolean}} loading
 * @property {?Object} error
 */

/** @returns {StudentRaceRuntimeState} a fresh object per call — never a shared singleton. */
export function createInitialRaceRuntimeState() {
  return {
    race: {
      id: null,
      title: "",
      roomCode: "",
      startedAt: null,
      finishedAt: null,
    },

    raceStatus: null,
    playerStatus: null,

    playerFinished: false,
    raceFinished: false,

    totalDistance: null,

    player: {
      position: 0,
      speed: 0,
      score: 0,
      streak: 0,
      highestStreak: 0,
      currentDifficulty: null,
    },

    question: {
      questionId: null,
      questionText: "",
      timeLimitSeconds: 0,
      expiresAt: null,
      choices: [],
    },

    answer: {
      isSubmitting: false,
      selectedChoiceId: null,
      correct: null,
      correctAnswerChoiceId: null,
      feedbackState: STUDENT_RACE_FEEDBACK.IDLE,
    },

    visual: {
      targetPosition: 0,
      targetSpeed: 0,
      activeEffect: null,
    },

    loading: {
      assets: false,
      raceState: false,
      question: false,
    },

    error: null,
  };
}
