/*
 * Hebrew strings for the errors namespace — every user-facing API/network
 * error message lives here. Raw server messages are NEVER shown; the error
 * layer (errors/normalizeApiError.js) always resolves to one of these keys.
 */
export default {
  network: "נראה שיש בעיית חיבור. נסו שוב בעוד רגע.",
  general: {
    server: "משהו השתבש אצלנו. נסו שוב.",
    unexpected: "אירעה שגיאה לא צפויה. נסו שוב.",
    notFound: "לא מצאנו את מה שחיפשתם.",
    conflict: "הפעולה מתנגשת עם מצב קיים. רעננו ונסו שוב.",
  },
  validation: {
    default: "חלק מהפרטים אינם תקינים. בדקו ונסו שוב.",
  },
  auth: {
    sessionExpired: "החיבור שלכם הסתיים. התחברו שוב.",
    forbidden: "אין לכם הרשאה לבצע את הפעולה הזו.",
  },
  teacher: {
    createRaceFailed: "לא הצלחנו ליצור את המרוץ. נסו שוב.",
    subjectsLoadFailed: "לא הצלחנו לטעון את רשימת הנושאים.",
    startRaceFailed: "לא הצלחנו להתחיל את המרוץ. נסו שוב.",
  },
  race: {
    full: "המרוץ כבר מלא.",
    alreadyStarted: "המרוץ כבר התחיל.",
    notFound: "לא מצאנו את המרוץ הזה.",
  },
};
