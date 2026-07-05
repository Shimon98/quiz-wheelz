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
    invalidCredentials: "פרטי ההתחברות לא נכונים. בדקו ונסו שוב.",
  },
  teacher: {
    createRaceFailed: "לא הצלחנו ליצור את המרוץ. נסו שוב.",
    subjectsLoadFailed: "לא הצלחנו לטעון את רשימת הנושאים.",
    startRaceFailed: "לא הצלחנו להתחיל את המרוץ. נסו שוב.",
  },
  race: {
    full: "המרוץ כבר מלא. בקשו מהמורה לפתוח מרוץ חדש.",
    alreadyStarted: "המרוץ כבר התחיל.",
    notFound: "לא מצאנו חדר עם הקוד הזה. בדקו את הקוד ונסו שוב.",
    notJoinable: "המרוץ כבר יצא לדרך. בקשו מהמורה קוד חדש.",
    nameTaken: "השם הזה כבר תפוס במרוץ. בחרו שם אחר.",
  },
  student: {
    joinFailed: "לא הצלחנו לצרף אתכם למרוץ. נסו שוב.",
  },
};
