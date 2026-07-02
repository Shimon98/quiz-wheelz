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
    copyRoomCode: "העתקת קוד חדר",
    copied: "הועתק!",
  },
  raceStatus: {
    waiting: "ממתין",
    ready: "מוכן",
    active: "בשידור חי",
    finished: "הסתיים",
    cancelled: "בוטל",
    unknown: "לא ידוע",
  },
  createRace: {
    title: "יצירת מרוץ חדש",
    nameLabel: "שם המרוץ",
    namePlaceholder: "לדוגמה: מרוץ כפל וחילוק",
    subjectLabel: "קטגוריית שאלות",
    subjectPlaceholder: "בחרו נושא",
    subjectLoading: "טוען נושאים...",
    subjectsLoadFailed: "לא הצלחנו לטעון את רשימת הנושאים.",
    playersLabel: "מספר משתתפים",
    lengthLabel: "אורך המרוץ",
    lengths: {
      short: "קצר",
      regular: "רגיל",
      long: "ארוך",
    },
    operatorsTitle: "סוגי תרגילים",
    operatorsSoon: "בקרוב: בחירת פעולות חשבון לפי מרוץ",
    operators: {
      addition: "חיבור",
      subtraction: "חיסור",
      multiplication: "כפל",
      division: "חילוק",
    },
    submit: "יצירת מרוץ",
    cancel: "ביטול",
    successTitle: "המרוץ נוצר!",
    successBody: "קוד החדר: {{roomCode}}",
    validation: {
      titleMinLength: "שם המרוץ חייב להכיל לפחות {{min}} תווים",
      titleMaxLength: "שם המרוץ יכול להכיל עד {{max}} תווים",
      subjectRequired: "בחרו קטגוריית שאלות",
    },
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
