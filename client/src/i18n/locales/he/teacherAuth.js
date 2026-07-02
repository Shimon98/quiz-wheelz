/*
 * Hebrew strings for the teacher auth screens (teacherAuth namespace) —
 * login / register / forgot-password flow, matching docs/vision/teacher-auth-flow.png.
 * Brand name "QuizWheelz" is a proper noun and stays untranslated.
 */
export default {
  // Shared labels — written ONCE, reused by every auth screen.
  common: {
    emailLabel: "אימייל",
    emailPlaceholder: "teacher@example.com",
    passwordLabel: "סיסמה",
  },
  login: {
    title: "ברוכים הבאים, מורה יקר/ה",
    subtitle: "היכנסו לחשבון המורה שלכם",
    forgotPassword: "שכחת סיסמה?",
    submit: "היכנסו לחשבון",
    noAccount: "אין לכם חשבון?",
    registerLink: "הרשמו כאן",
    checkingSession: "בודק התחברות...",
  },
  register: {
    title: "צרו חשבון מורה חדש",
    subtitle: "הצטרפו אלינו והתחילו ליצור משחקי ידע מרתקים",
    fullNameLabel: "שם מלא",
    fullNamePlaceholder: "ישראל ישראלי",
    confirmPasswordLabel: "אימות סיסמה",
    acceptsEmailsLabel: "אני מאשר/ת קבלת אימיילים מבית QuizWheelz",
    submit: "צרו חשבון",
    hasAccount: "כבר יש לכם חשבון?",
    loginLink: "היכנסו כאן",
    successTitle: "החשבון נוצר בהצלחה!",
    successBody: "כעת תוכלו להתחבר עם הפרטים שהזנתם.",
  },
  forgot: {
    requestTitle: "נשלח קוד אימות לאימייל",
    requestSubtitle: "הזינו את האימייל שלכם ונשלח לכם קוד לאיפוס הסיסמה",
    requestSubmit: "שלחו קוד אימות במייל",
    sentNote: "נשלח! אם האימייל קיים במערכת, תקבלו קוד לאיפוס הסיסמה.",
    verifyTitle: "הזינו את קוד האימות",
    verifySubtitle: "שלחנו קוד בן {{codeLength}} ספרות לכתובת {{email}}",
    verifySubmit: "המשך",
    noCode: "לא קיבלתם קוד?",
    resendIn: "שלחו שוב בעוד {{time}}",
    resend: "שלחו שוב",
    resetTitle: "הגדירו סיסמה חדשה",
    resetSubtitle: "בחרו סיסמה חדשה ומאובטחת לחשבון",
    newPasswordLabel: "סיסמה חדשה",
    confirmPasswordLabel: "אימות סיסמה חדשה",
    resetSubmit: "עדכון סיסמה",
    successNote: "הסיסמה עודכנה בהצלחה! כעת תוכלו להתחבר לחשבון שלכם.",
    backToLogin: "חזרה להתחברות",
  },
  validation: {
    identifierRequired: "נא להזין אימייל או שם משתמש",
    emailRequired: "נא להזין אימייל",
    emailInvalid: "כתובת האימייל אינה תקינה",
    fullNameRequired: "נא להזין שם מלא",
    passwordRequired: "נא להזין סיסמה",
    passwordMinLength: "הסיסמה חייבת להכיל לפחות {{min}} תווים",
    passwordsMismatch: "הסיסמאות אינן תואמות",
    codeIncomplete: "נא להזין את כל {{codeLength}} הספרות",
  },
};
