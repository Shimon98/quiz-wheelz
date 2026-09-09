export default {
  preview: {
    question: "DEV · Feedback preview",
    correct: "Correct",
    combo: "Streak 3",
    strongCombo: "Streak 5",
    wrong: "Wrong",
  },
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
    disconnectedBody: "You can't continue this race. You can join a new race with a room code.",

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

  connection: {
    offlineTitle: "No internet connection",
    offlineBody: "We'll keep your screen and try to reconnect",
    reconnectingTitle: "Reconnecting...",
    reconnectingBody: "Continuing from where the server left off in a moment",
  },

  hud: {
    scoreLabel: "Score",
    rankLabel: "Place",
    rankValue: "Place {{rank}} of {{count}}",
    streakLabel: "Correct answer streak",
    streakShortLabel: "Streak",
    streakValue: "{{count}} correct answers in a row",
    streakValue_one: "One correct answer in a row",
    comboLabel: "Combo",
    speedLabel: "Speed",
    speedValue: "Speed {{speed}}",
    progressLabel: "Race progress",
    progressShortLabel: "Track",
  },

  reward: {
    correctTitle: "Correct answer!",
    comboTitle: "Combo!",
    streak: "{{count}} in a row",
    points: "points",
  },

  timer: {
    label: "Time left for this question",
  },
};
