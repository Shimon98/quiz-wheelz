/*
 * English strings for the errors namespace — mirrors locales/he/errors.js
 * key-for-key.
 */
export default {
  network: "Connection problem. Please try again in a moment.",
  general: {
    server: "Something went wrong on our side. Please try again.",
    unexpected: "An unexpected error occurred. Please try again.",
    notFound: "We could not find what you were looking for.",
    conflict: "This action conflicts with the current state. Refresh and try again.",
  },
  validation: {
    default: "Some of the details are invalid. Please check and try again.",
  },
  auth: {
    sessionExpired: "Your session has ended. Please sign in again.",
    forbidden: "You do not have permission to do this.",
    invalidCredentials: "Wrong sign-in details. Please check and try again.",
  },
  teacher: {
    createRaceFailed: "We could not create the race. Please try again.",
    subjectsLoadFailed: "We could not load the subjects list.",
    startRaceFailed: "We could not start the race. Please try again.",
  },
  race: {
    full: "This race is already full. Ask your teacher to open a new one.",
    alreadyStarted: "This race has already started.",
    notFound: "We could not find a room with this code. Check the code and try again.",
    notJoinable: "This race is already on its way. Ask your teacher for a new code.",
    nameTaken: "This name is already taken in the race. Pick another one.",
  },
  student: {
    joinFailed: "We could not add you to the race. Please try again.",
  },
};
