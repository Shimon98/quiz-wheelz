export const TEACHER_FEED_KINDS = Object.freeze({
  CORRECT_ANSWER: "CORRECT_ANSWER",
  RANK_UP: "RANK_UP",
  PLAYER_FINISHED: "PLAYER_FINISHED",
  RACE_FINISHED: "RACE_FINISHED",
});

export const TEACHER_FEED_MESSAGE_KEYS = Object.freeze({
  [TEACHER_FEED_KINDS.CORRECT_ANSWER]: "feed.correctAnswer",
  [TEACHER_FEED_KINDS.RANK_UP]: "feed.rankUp",
  [TEACHER_FEED_KINDS.PLAYER_FINISHED]: "feed.playerFinished",
  [TEACHER_FEED_KINDS.RACE_FINISHED]: "feed.raceFinished",
});

export const TEACHER_LIVE_FEED_CONFIG = Object.freeze({
  maxItems: 5,
});
