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

  results: {
    title: "Race results",
    liveBadge: "Race still running",
    finalBadge: "Final results",
    heroReached: "You reached the finish line!",
    heroConfirming: "Confirming your place...",
    heroRank: "You finished in place {{rank}}!",
    heroRankTied: "You finished in place {{rank}} — tied!",
    heroFinalLabel: "Your final result",
    heroRaceEnded: "The race has ended",
    heroNotCompleted: "You did not complete the race",
    heroFinalRanking: "Final ranking: place {{rank}}",
    score: "Score",
    bestStreak: "Best streak",
    progressLabel: "Race progress",
    progressLive: "Finished: {{finished}} · Still racing: {{racing}}",
    progressOut: "{{count}} participants are no longer racing",
    progressOut_one: "1 participant is no longer racing",
    groupRanked: "Finished",
    groupConfirming: "Reached the finish — confirming place",
    groupRacing: "Still racing",
    groupOut: "No longer racing",
    statusConfirming: "Confirming place",
    statusRacing: "On the way",
    statusOut: "Out of the race",
    statusDidNotFinish: "Did not finish",
    you: "You",
    finalAllCompleted: "All participants finished the race",
    finalCompleted: "{{finished}} of {{count}} completed the race",
    finalStandings: "Final standings",
    joinNewRace: "Join another race",
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
    sharedRankLabel: "Place — tied",
    sharedRankValue: "Place {{rank}} of {{count}} — tied",
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

  deviceAdvice: {
    title: "A phone is recommended",
    body: "The race is designed for a phone screen. You can keep going here, but a phone is the most comfortable.",
    confirm: "Continue here",
  },
};
