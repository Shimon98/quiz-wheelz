/*
 * English strings for the student race screen — mirrors
 * locales/he/studentRace.js key-for-key.
 */
export default {
  status: {
    loadingTitle: "Loading the race...",
    loadingBody: "Starting in a moment!",

    errorTitle: "We could not load the race",
    retry: "Try again",

    waitingTitle: "The race has not started yet",
    waitingBody: "Waiting for the teacher to start the race.",

    finishedTitle: "You finished the race! 🎉",
    finishedBody: "Great job! Full results will appear here soon.",

    cancelledTitle: "The race was cancelled",
    cancelledBody: "The teacher closed this race. You can join a new race with a room code.",

    disconnectedTitle: "You lost connection to the race",
    disconnectedBody: "You can try refreshing the race state.",

    unknownTitle: "Something went wrong",
    unknownBody: "We got an unexpected state from the server. Try refreshing.",
  },

  question: {
    instruction: "Choose the correct answer",
    errorTitle: "We couldn't load the question",
    timeUp: "Time's up! Loading a new question...",
    syncError: "Time's up, but we couldn't update",
    correctFeedback: "Correct!",
    wrongFeedback: "Almost!",
    answerSyncing: "Checking the race state...",
    loadingNext: "Loading the next question...",
  },

  hud: {
    scoreLabel: "Score",
    streakLabel: "Correct answer streak",
    speedLabel: "Speed",
    progressLabel: "Race progress",
  },

  timer: {
    label: "Time left for this question",
  },
};
