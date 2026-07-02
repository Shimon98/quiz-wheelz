כן, בוא נעשה סדר. מבחינתי UI-07 צריך להתחלק לשני חלקים ברורים:

1. **יצירת מרוץ חדש**
2. **תשתית שגיאות + Notifications + תרגום לפי שפה**

זה מתאים לתכנון המקורי של שלב א, שבו המורה יוצר מרוץ עם מקצוע/נושא, כותרת, מספר שחקנים ומרחק/אורך, והשרת מחזיר מרוץ עם קוד חדר. במסמך שלב א גם מופיעים `GET /api/subjects` ו־`POST /api/teacher/races` בתור ה־endpoints הרלוונטיים ליצירת מרוץ. fileciteturn84file2  
בנוסף, לפי אפיון הפרויקט, המורה יוצר חדר מרוץ, מקבל קוד חדר, והתלמידים מצטרפים עם הקוד, אז אחרי יצירת מרוץ הזרימה הכי הגיונית היא לעבור לחדר המתנה/חדר מרוץ. fileciteturn84file0

---

# תוכנית UI-07A — יצירת מרוץ חדש

## החלטה מרכזית

לא בונים “סתם Modal”.  
בונים **תשתית מסודרת ליצירת מרוץ**, אבל שולחים לשרת רק את מה שהשרת תומך בו כרגע.

כלומר:

```text id="cdpoea"
כן שולחים:
- שם מרוץ
- קטגוריית שאלות / subject לפי השרת
- מספר משתתפים
- אורך מרוץ, אבל מאחורי הקלעים כמיפוי ל-totalDistance אם זה מה שהשרת דורש

לא שולחים עכשיו:
- אופרטורים: חיבור / חיסור / כפל / חילוק
```

האופרטורים יהיו קיימים במסך כתשתית עתידית, אבל מסומנים כ־**בקרוב / לא פעיל** כדי לא להטעות את המשתמש.

---

## שדות הטופס

### 1. שם המרוץ

שדה רגיל:

```text id="7r22vn"
שם המרוץ
לדוגמה: מרוץ כפל וחילוק
```

ולידציה:

```text id="jdjwhr"
- חובה
- 2 עד 40 תווים בערך
- בלי רווחים בלבד
```

ב־DTO לשרת זה כנראה יהיה:

```js id="8hdhou"
title
```

או אם השרת משתמש בשם אחר, עושים mapper ב־API client ולא מפזרים את זה בקומפוננטות.

---

### 2. קטגוריית שאלות / נושא

הבחירה צריכה להגיע מהשרת.

לפי התכנון המקורי זה `Subject`, וה־endpoint הוא:

```http id="jvb4qz"
GET /api/subjects
```

ב־UI אפשר לקרוא לזה:

```text id="6l5270"
קטגוריית שאלות
```

או:

```text id="r0ugxh"
נושא המרוץ
```

אבל בקוד עדיף להישאר עקביים עם השרת:

```js id="xmhjes"
subjectId
```

ולא להמציא עכשיו `categoryId` אם השרת עובד עם `Subject`.

---

### 3. מספר משתתפים

בחירה נוחה, לא input חופשי אם אפשר.

אפשרויות:

```text id="gx7owm"
2, 3, 4, 5, 6, 7, 8
```

או אם השרת מאפשר גם 1:

```text id="r142q4"
1–8
```

אבל לפי האפיון המקורי יש מגבלה של עד 8 מתחרים במרוץ. fileciteturn84file0

רכיב מתאים:

```text id="g4kcv0"
Mantine NumberInput
או
SegmentedControl / pills אם זה נראה טוב
```

לדעתי עדיף לילדים/מורים:

```text id="j7urej"
כפתורי בחירה קטנים: 2 3 4 5 6 7 8
```

זה יותר נקי מ־input מספרי.

---

### 4. אורך המרוץ

לא להציג למורה “1000 נקודות”.  
המורה לא צריך לדעת את המודל הפנימי.

ב־UI:

```text id="qj2msd"
קצר
רגיל
ארוך
```

מאחורי הקלעים, אם השרת עדיין מצפה ל־`totalDistance`, עושים מיפוי:

```js id="glant4"
const RACE_LENGTH_TO_DISTANCE = {
  short: 600,
  normal: 1000,
  long: 1400,
};
```

הערכים המדויקים לא חשובים עכשיו, העיקר שה־UI לא יראה נקודות.

ה־form state:

```js id="vgouzs"
raceLength: "normal"
```

ה־API payload:

```js id="xp3r34"
{
  title,
  subjectId,
  maxPlayers,
  totalDistance: RACE_LENGTH_TO_DISTANCE[raceLength]
}
```

אם בעתיד השרת יעבור ל־`raceLength`, נחליף רק את mapper של ה־API.

---

### 5. אופרטורים — תשתית לא פעילה

זה חלק חשוב, אבל לא לשלוח לשרת.

ב־UI תהיה קבוצה של “בועות”:

```text id="wdyzkd"
＋ חיבור
− חיסור
× כפל
÷ חילוק
```

אבל הן יהיו:

```text id="5utff2"
disabled
coming soon
לא משפיעות על יצירת המרוץ
לא נכנסות ל-payload
```

אפשר להציג כותרת:

```text id="gnnqec"
סוגי תרגילים
```

ומתחת:

```text id="pzqduy"
בקרוב: בחירת פעולות חשבון לפי מרוץ
```

ככה אנחנו מקימים את המקום הנכון במסך, אבל לא יוצרים הבטחה מזויפת.

---

# מבנה קבצים מומלץ

לא לערבב עם הישן. בתוך המבנה החדש של teacher workspace:

```text id="gyssm2"
client/src/features/teacherWorkspace/createRace/
  components/
    CreateRaceModal.jsx
    CreateRaceForm.jsx
    RaceNameField.jsx
    SubjectSelectField.jsx
    MaxPlayersPicker.jsx
    RaceLengthPicker.jsx
    FutureOperatorsPicker.jsx

  hooks/
    useCreateRaceForm.js
    useCreateRaceMutation.js
    useSubjectsQuery.js

  config/
    raceLengthOptions.js
    futureOperatorOptions.js
    createRaceValidation.js

  api/
    createRaceMapper.js
```

אם כבר יש תיקיות דומות ב־`teacherWorkspace`, להכניס לשם לפי הסגנון הקיים החדש.

---

# זרימת יצירת מרוץ

ההמלצה שלי: **אחרי יצירת מרוץ מוצלחת עוברים ישר לחדר המתנה**.

הסיבה: המורה יוצר מרוץ כדי להפעיל אותו בכיתה, אז הוא צריך מיד לראות:

```text id="nk98oz"
- קוד חדר
- סטטוס המרוץ
- כמה תלמידים הצטרפו
- כפתור התחלת מרוץ
```

זה גם תואם לתכנון של שלב א: אחרי יצירת מרוץ, המורה נכנס לעמוד חדר מרוץ בסיסי ורואה קוד חדר, סטטוס ומידע ראשוני. fileciteturn84file2

הזרימה:

```text id="4in9w4"
לחיצה על "יצירת מרוץ חדש"
↓
פתיחת Modal
↓
טעינת subjects מהשרת
↓
מילוי שם / נושא / משתתפים / אורך
↓
לחיצה יצירת מרוץ
↓
POST /api/teacher/races
↓
הצלחה:
  - סגירת Modal
  - notification הצלחה
  - רענון/עדכון dashboard cache
  - ניווט לחדר המתנה של המרוץ
שגיאה:
  - notification ידידותי לפי מערכת השגיאות החדשה
  - לא להציג raw server error
```

---

# Definition of Done ל־UI-07A

```text id="uyotpn"
UI-07A נחשב סגור כאשר:

- כפתור "יצירת מרוץ חדש" פותח Modal חדש ונקי.
- הטופס בנוי עם Mantine.
- שדה שם מרוץ עובד עם ולידציה.
- subject/category נטען מהשרת.
- maxPlayers נבחר בצורה ידידותית.
- אורך מרוץ מוצג כקצר/רגיל/ארוך ולא כנקודות.
- totalDistance ממופה רק בשכבת API אם השרת דורש.
- אופרטורים מוצגים כתשתית עתידית אבל disabled ולא נשלחים לשרת.
- יצירה מוצלחת מציגה notification.
- אחרי הצלחה עוברים לחדר המתנה או לפחות מוכנים לניווט אליו.
- שגיאות מוצגות דרך מערכת השגיאות החדשה.
- אין שימוש בדשבורד הישן.
- build/lint עוברים.
```

---

# תוכנית UI-07B — מערכת שגיאות + Notifications

פה צריך לעצור ולעשות את זה נכון, כי אחרת כל מסך יציג שגיאות בצורה אחרת.

המטרה:

```text id="stzr3w"
לא מציגים למשתמש הודעות גולמיות מהשרת.
לא מפזרים try/catch עם טקסטים בכל קומפוננטה.
כל שגיאה עוברת normalization.
כל הודעה למשתמש מגיעה לפי שפה.
Notifications מציגים הודעות יפות ועקביות.
```

העיקרון הכללי של הפרויקט הוא שהשרת הוא מקור האמת והלקוח רק מציג מצב/תגובות בצורה חווייתית, ולכן גם בשגיאות הלקוח צריך לתרגם את מצב השגיאה להודעה ידידותית ולא לחשוף מידע טכני. fileciteturn84file5

---

## שכבות מערכת השגיאות

### שכבה 1 — API Error Normalizer

קובץ לדוגמה:

```text id="zhxef5"
client/src/shared/errors/normalizeApiError.js
```

התפקיד שלו:

לקבל שגיאה מ־axios/fetch ולהחזיר אובייקט אחיד:

```js id="43ofhf"
{
  status: 400,
  code: "RACE_FULL",
  messageKey: "errors.race.full",
  severity: "error",
  rawMessage: "...",
}
```

הוא צריך לדעת להתמודד עם:

```text id="9jpgul"
- אין אינטרנט
- timeout
- 400 validation
- 401 unauthorized
- 403 forbidden
- 404 not found
- 409 conflict
- 500 server error
- שגיאה לא צפויה
```

---

### שכבה 2 — Error Code Mapping

קובץ לדוגמה:

```text id="fedwcq"
client/src/shared/errors/errorMessageMap.js
```

מיפוי לדוגמה:

```js id="b2hlm3"
export const ERROR_MESSAGE_KEYS = {
  NETWORK_ERROR: "errors.network",
  UNAUTHORIZED: "errors.auth.unauthorized",
  FORBIDDEN: "errors.auth.forbidden",
  NOT_FOUND: "errors.general.notFound",
  VALIDATION_ERROR: "errors.validation.default",

  RACE_FULL: "errors.race.full",
  RACE_ALREADY_STARTED: "errors.race.alreadyStarted",
  RACE_NOT_FOUND: "errors.race.notFound",
  SUBJECT_NOT_FOUND: "errors.subject.notFound",
  CREATE_RACE_FAILED: "errors.teacher.createRaceFailed",
};
```

אם השרת לא מחזיר עדיין `code`, עושים fallback לפי status.

לדוגמה:

```text id="hl57z3"
409 ביצירת מרוץ -> errors.teacher.createRaceConflict
500 -> errors.general.server
Network -> errors.network
```

---

### שכבה 3 — i18n messages

אם יש כבר מערכת שפות קיימת, להכניס לשם.

לדוגמה:

```text id="4dkva0"
client/src/i18n/locales/he/errors.js
client/src/i18n/locales/en/errors.js
```

עברית:

```js id="tfsvlo"
errors: {
  network: "נראה שיש בעיית חיבור. נסה שוב בעוד רגע.",
  general: {
    server: "משהו השתבש אצלנו. נסה שוב.",
    unexpected: "אירעה שגיאה לא צפויה.",
    notFound: "לא מצאנו את מה שחיפשת.",
  },
  auth: {
    unauthorized: "החיבור שלך הסתיים. התחבר שוב.",
    forbidden: "אין לך הרשאה לבצע פעולה זו.",
  },
  teacher: {
    createRaceFailed: "לא הצלחנו ליצור את המרוץ. נסה שוב.",
  },
  race: {
    full: "המרוץ כבר מלא.",
    alreadyStarted: "המרוץ כבר התחיל.",
    notFound: "לא מצאנו את המרוץ הזה.",
  },
}
```

אנגלית:

```js id="98gjq3"
errors: {
  network: "Connection problem. Please try again in a moment.",
  general: {
    server: "Something went wrong on our side. Please try again.",
    unexpected: "An unexpected error occurred.",
    notFound: "We could not find what you were looking for.",
  },
  auth: {
    unauthorized: "Your session expired. Please sign in again.",
    forbidden: "You do not have permission to do this.",
  },
  teacher: {
    createRaceFailed: "We could not create the race. Please try again.",
  },
  race: {
    full: "This race is already full.",
    alreadyStarted: "This race has already started.",
    notFound: "We could not find this race.",
  },
}
```

---

### שכבה 4 — Notification helper

קובץ לדוגמה:

```text id="7j89g2"
client/src/shared/notifications/showAppNotification.js
```

או:

```text id="6ublah"
client/src/shared/notifications/useAppNotifications.js
```

תפקיד:

```text id="qmm4jl"
showSuccess
showError
showWarning
showInfo
showApiError
```

לדוגמה:

```js id="o1j1ed"
showApiError(error, {
  fallbackKey: "errors.teacher.createRaceFailed",
});
```

הוא יעשה:

```text id="whp0ib"
1. normalizeApiError(error)
2. למצוא messageKey
3. לתרגם לפי השפה הנוכחית
4. להציג Mantine notification
```

---

## איפה לחבר את Mantine Notifications

צריך לוודא שיש ב־root:

```jsx id="nwwvo6"
<Notifications position="top-center" />
```

כנראה בתוך:

```text id="ep5zgb"
AppProviders
```

או איפה שמוגדר MantineProvider.

לא לשים Notifications בתוך כל עמוד.

---

# כללי שימוש בשגיאות

## שגיאות ולידציה בטופס

שגיאות שהמשתמש יכול לתקן מיד — מציגים בתוך הטופס.

לדוגמה:

```text id="xiw9ov"
שם מרוץ חובה
בחר נושא
בחר מספר משתתפים
```

## שגיאות שרת / תקשורת

מציגים ב־Notification.

לדוגמה:

```text id="8m1pir"
לא הצלחנו ליצור את המרוץ. נסה שוב.
```

## שגיאות הרשאה

אם מקבלים 401:

```text id="z8quow"
- מציגים הודעה: החיבור שלך הסתיים
- מנקים auth state אם צריך
- מחזירים ל-login
```

## לא להציג raw message

אסור לעשות:

```js id="co8iy9"
notification.show(error.response.data.message)
```

אלא רק:

```js id="3t0ft5"
showApiError(error)
```

---

# מבנה קבצים מומלץ למערכת השגיאות

```text id="7e90f6"
client/src/shared/errors/
  normalizeApiError.js
  errorCodes.js
  errorMessageMap.js
  getApiErrorMessageKey.js

client/src/shared/notifications/
  showAppNotification.js
  useAppNotifications.js

client/src/i18n/
  locales/
    he/
      errors.js
      teacher.js
    en/
      errors.js
      teacher.js
```

אם אין לכם עדיין i18n מסודר בקבצים כאלה, להתאים למבנה הקיים ולא להמציא מערכת כפולה.

---

# מה לבדוק לפני שינוי

קלוד צריך לבדוק קודם:

```text id="onmjxh"
- האם כבר מותקן @mantine/notifications
- איפה MantineProvider נמצא
- האם יש i18n קיים
- האם יש language store קיים
- האם apiClient כבר עושה interceptors
- האם יש FormError/Auth errors מהלוגין
- האם יש helper קיים לשגיאות
```

אבל חשוב:  
אם יש מערכת שגיאות ישנה ומבולגנת — לא בונים עליה בכוח.  
לוקחים רק מה שעובד ונקי, ומקימים שכבה מסודרת חדשה.

---

# Definition of Done ל־UI-07B

```text id="26b7y1"
UI-07B נחשב סגור כאשר:

- קיימת פונקציה normalizeApiError.
- שגיאות API מתורגמות ל-messageKey.
- אין הצגת raw server error למשתמש.
- Mantine Notifications מחוברות ברמת האפליקציה.
- יש helper אחיד להצגת success/error/warning/info.
- הודעות שגיאה קיימות בעברית ובאנגלית.
- Create Race משתמש במערכת החדשה.
- שגיאות ולידציה נשארות בתוך הטופס.
- שגיאות שרת מוצגות ב-notification.
- 401 מטופל בצורה אחידה.
- אין כפילות של הודעות שגיאה בתוך קומפוננטות.
- build/lint עוברים.
```

---

# נוסח מסודר לשליחה לקלוד

```text id="3hb9s7"
UI-07 includes two connected tasks:

1. Create Race Modal / Form
2. Centralized Error + Notifications foundation

Important:
Do not reuse the old dashboard UI.
Use the new teacher dashboard foundation only.
Use Mantine-first components.
Do not create fake working features.

## UI-07A — Create Race

Build a clean Mantine modal opened from the existing “Create New Race” button.

The form fields:

1. Race name
   - required
   - friendly validation
   - maps to the server field, probably title

2. Question category / Subject
   - load from the server
   - use the existing subjects endpoint/API pattern
   - UI can say “קטגוריית שאלות” or “נושא”
   - code should stay aligned with the backend naming, probably subjectId

3. Max players
   - choose visually, preferably buttons/pills
   - max should follow server/project rule, currently up to 8
   - do not use a messy free input if a clean picker works better

4. Race length
   - UI labels only:
     short / normal / long
     קצר / רגיל / ארוך
   - do not show points to the teacher
   - if the backend currently requires totalDistance, map length to totalDistance only in the API mapper

5. Future operators section
   - addition / subtraction / multiplication / division
   - display as disabled coming-soon chips/pills
   - do not submit operators to the server
   - do not make the teacher think this changes the race today
   - this is only UI infrastructure for future backend support

Submit payload should include only fields supported by the backend today:
- title/name
- subjectId
- maxPlayers
- totalDistance if required

Do not include operators in the payload.

On success:
- close modal
- show success notification
- refresh/update dashboard state
- navigate to the teacher race waiting room if route/API exists

If waiting room is not connected yet:
- close modal
- show success notification
- refresh dashboard
- keep route integration ready

## UI-07B — Error + Notifications

Create a centralized error handling foundation.

Goal:
- no raw server errors shown to users
- no duplicated error text in components
- all user-facing errors are localized according to current language
- all server/network errors can be shown through Mantine Notifications

Implement or organize:

shared/errors/
- normalizeApiError.js
- errorCodes.js
- errorMessageMap.js
- getApiErrorMessageKey.js

shared/notifications/
- showAppNotification.js
- useAppNotifications.js

i18n/locales:
- Hebrew error messages
- English error messages

Behavior rules:
- form validation errors stay inline in the form
- server/network errors appear as notifications
- success messages appear as notifications
- 401 should be handled consistently, probably by clearing auth state and redirecting to login
- do not show error.response.data.message directly to the user
- use message keys and translations

Before implementing, inspect the current app:
- Mantine provider
- notifications setup
- existing language/i18n foundation
- existing apiClient/interceptors
- existing auth error handling

Reuse clean shared foundation if it exists.
Do not build on messy legacy dashboard code.

Create Race must use the new error/notification foundation.
```

---

החלטה שלי לגבי השאלה שקלוד שאל:  
**אחרי יצירת מרוץ — לעבור ישר לחדר המתנה.**  
אם החדר עדיין לא מוכן ב־route, אז זמנית להישאר בדשבורד עם notification ורענון רשימה, אבל לבנות את הקוד כך שהמעבר לחדר יהיה הצעד הטבעי הבא.
