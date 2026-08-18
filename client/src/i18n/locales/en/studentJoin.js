/*
 * English strings for the student join + waiting flow — mirrors
 * locales/he/studentJoin.js key-for-key.
 */
export default {
  join: {
    title: "Join the race",
    subtitle: "Type the room code you got from your teacher",
    codeFromLink: "The room code was filled from the link — just add your name!",
    roomCodeLabel: "Room code",
    nameLabel: "What's your name?",
    namePlaceholder: "The name shown in the race",
    submit: "Let's race!",
    back: "Back",
    validation: {
      roomCodeLength: "The room code has {{length}} characters",
      nameMinLength: "Your name needs at least {{min}} characters",
      nameMaxLength: "Your name can be up to {{max}} characters",
    },
  },
  waiting: {
    joined: "You're in!",
    hello: "Hi, {{name}}!",
    roomCodeLabel: "Room code",
    laneLabel: "Your lane",
    playersLabel: "Players connected",
    waitingForTeacher: "Waiting for your teacher to start the race",
    keepOpen: "Keep this screen open — the race starts very soon!",
    loadErrorTitle: "Something went wrong",
    retry: "Try again",
  },
};
