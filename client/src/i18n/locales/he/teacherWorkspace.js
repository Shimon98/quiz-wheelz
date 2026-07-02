/*
 * Hebrew strings for the teacher workspace (teacherWorkspace namespace) —
 * dashboard home, navigation and race preview, matching the new teacher
 * dashboard vision. Brand name "QuizWheelz" stays untranslated.
 */
export default {
  nav: {
    menu: "תפריט",
    dashboard: "לוח בקרה",
    races: "מרוצים",
    settings: "הגדרות",
    logout: "התנתקות",
    comingSoon: "בקרוב",
  },
  profile: {
    role: "מורה",
  },
  greeting: {
    title: "שלום, {{name}}!",
    titleNoName: "שלום!",
    subtitle: "כאן תמצאו את כל המרוצים שלכם במבט אחד.",
  },
  actions: {
    createRace: "יצירת מרוץ חדש",
    createRaceSoonTitle: "כבר מגיע!",
    createRaceSoonBody: "יצירת מרוץ מהלוח החדש מתחברת ממש בקרוב.",
    viewAllRaces: "הצג את כל המרוצים",
  },
  stats: {
    active: "מרוצים פעילים",
    waiting: "מרוצים ממתינים",
    cancelled: "מרוצים שבוטלו",
    total: 'סה"כ מרוצים',
  },
  races: {
    title: "המרוצים שלי",
    columns: {
      name: "שם המרוץ",
      subject: "נושא",
      players: "שחקנים",
      status: "מצב",
      roomCode: "קוד חדר",
      createdAt: "נוצר בתאריך",
    },
    open: "פתיחת מרוץ",
  },
  raceStatus: {
    waiting: "ממתין",
    ready: "מוכן",
    active: "בשידור חי",
    finished: "הסתיים",
    cancelled: "בוטל",
    unknown: "לא ידוע",
  },
  states: {
    loading: "טוען את הלוח...",
    errorTitle: "משהו השתבש בדרך",
    errorBody: "לא הצלחנו לטעון את לוח הבקרה. נסו שוב עוד רגע.",
    retry: "נסו שוב",
    emptyTitle: "עדיין אין מרוצים",
    emptyBody: "צרו את המרוץ הראשון שלכם והג'ונגל יתעורר לחיים!",
  },
};
