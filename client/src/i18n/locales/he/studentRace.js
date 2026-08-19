/*
 * Hebrew strings for the student race screen. D scope: page status states
 * only — question/timer/HUD strings land with C1-02/C1-04. Generic API error
 * bodies stay in the errors namespace; these are race-specific texts.
 */
export default {
  status: {
    loadingTitle: "טוענים את המרוץ...",
    loadingBody: "עוד רגע מתחילים!",

    errorTitle: "לא הצלחנו לטעון את המרוץ",
    retry: "נסו שוב",

    waitingTitle: "המרוץ עוד לא התחיל",
    waitingBody: "מחכים שהמורה יתחיל את המרוץ.",

    finishedTitle: "סיימתם את המרוץ! 🎉",
    finishedBody: "כל הכבוד! התוצאות המלאות יוצגו כאן בהמשך.",

    cancelledTitle: "המרוץ בוטל",
    cancelledBody: "המורה סגר את המרוץ הזה. אפשר להצטרף למרוץ חדש עם קוד חדר.",

    disconnectedTitle: "החיבור למרוץ נותק",
    disconnectedBody: "אפשר לנסות לרענן את מצב המרוץ.",

    unknownTitle: "משהו לא הסתדר",
    unknownBody: "קיבלנו מצב לא צפוי מהשרת. נסו לרענן.",
  },

  question: {
    instruction: "בחרו את התשובה הנכונה",
    errorTitle: "לא הצלחנו לטעון את השאלה",
    timeUp: "נגמר הזמן! טוענים שאלה חדשה...",
    syncError: "נגמר הזמן, אבל לא הצלחנו להתעדכן",
    correctFeedback: "נכון!",
    wrongFeedback: "כמעט!",
    answerSyncing: "בודקים את מצב המרוץ...",
    loadingNext: "טוענים את השאלה הבאה...",
  },

  timer: {
    label: "הזמן שנותר לשאלה",
  },
};
