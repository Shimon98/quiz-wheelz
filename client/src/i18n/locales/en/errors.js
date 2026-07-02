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
  },
  teacher: {
    createRaceFailed: "We could not create the race. Please try again.",
    subjectsLoadFailed: "We could not load the subjects list.",
  },
  race: {
    full: "This race is already full.",
    alreadyStarted: "This race has already started.",
    notFound: "We could not find this race.",
  },
};
