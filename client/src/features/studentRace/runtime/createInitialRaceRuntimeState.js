import { STUDENT_RACE_FEEDBACK } from "./studentRaceRuntimeConstants.js";


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
    playerCount: null,

    player: {
      racePlayerId: null,
      displayName: "",
      laneNumber: null,
      vehicleTypeKey: null,
      vehicleColorKey: null,
      vehicleAssetKey: null,

      position: 0,
      speed: 0,
      score: 0,
      streak: 0,
      highestStreak: 0,
      rank: null,
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

    lastSnapshotAtEpochMs: null,

    visual: {
      targetPosition: 0,
      targetSpeed: 0,
      movementUnitsPerSecond: 0,
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
