# QuizWheelz — Server Constants & Controller Conventions

מטרת המסמך: לשמור כלל עבודה אחיד בפרויקט QuizWheelz, כדי שבכל פעם שמוסיפים Controller, Service, DTO או קבוע חדש נדע איפה לשים אותו, מה להוציא לקבועים, ומה להשאיר מקומי.

---

## כלל מרכזי

לא יוצרים מחלקת `Constants` אחת ענקית.

במקום זה כל סוג קבוע הולך למקום שמתאים למשמעות שלו:

| סוג הקבוע | איפה לשים |
|---|---|
| Endpoint path | `common/ApiPaths.java` |
| הודעת הצלחה של API response | `common/ApiMessages.java` |
| הודעת Auth שחוזרת בכמה מקומות | `exception/ErrorMessages.java` או בעתיד `common/AuthMessages.java` |
| שגיאת מערכת עם code + HTTP status | `exception/ErrorCode.java` |
| שם משתנה סביבה / property | `config/ConfigPropertyKeys.java` |
| חוק משחק / חוק עסקי כללי | `common/RaceRules.java` או Rules class ייעודי |
| ביטוי הרשאה של `@PreAuthorize` | `security/SecurityExpressions.java` |
| קבוע טכני של Security | `security/SecurityConstants.java` |
| שם JWT claim | `security/JwtClaims.java` |
| קבועי Cookie נמוכים | `utils/CookieConstants.java` |
| קבוע שמשמש רק במחלקה אחת | `private static final` באותה מחלקה |

---

## שאלון החלטה מהיר

```text
1. זה path של endpoint?
   כן → ApiPaths

2. זו הודעת הצלחה של response?
   כן → ApiMessages

3. זו הודעת auth שחוזרת בכמה מקומות?
   כן →  AuthMessages

4. זו הודעת שגיאה רגילה עם קוד HTTP?
   כן → להשאיר ב־ErrorCode

5. זה key של env/property?
   כן → ConfigPropertyKeys

6. זה חוק משחק כמו maxPlayers?
   כן → RaceRules

7. זה משמש רק במחלקה אחת?
   כן → private static final באותה מחלקה
```

---

## כלל זהב

לא כל string או number חייב להיות constant.

מוציאים לקבוע רק אם אחד מהבאים נכון:

```text
1. הוא חוזר ביותר ממקום אחד.
2. הוא מייצג חוזה API או Security.
3. הוא חוק עסקי.
4. הוא שם property/env.
5. שינוי שלו בעתיד צריך לקרות במקום אחד.
```

אם string מופיע פעם אחת והוא הודעת validation מקומית או טקסט פנימי של מחלקה אחת — אפשר להשאיר אותו שם.

---

## ApiPaths

כל נתיבי ה־API צריכים להיות ב־`ApiPaths`.

שימוש נכון:

```java
@RestController
@RequestMapping(ApiPaths.TEACHER_DASHBOARD)
public class TeacherDashboardController {
}
```

שימוש נכון ב־SecurityConfig:

```java
.requestMatchers(HttpMethod.POST, ApiPaths.AUTH_LOGIN).permitAll()
.requestMatchers(ApiPaths.ALL_API_ENDPOINTS).authenticated()
```

לא לעשות:

```java
@RequestMapping("/api/teacher/dashboard")
```

---

## ApiMessages

`ApiMessages` מיועד רק להודעות הצלחה שחוזרות ללקוח דרך `ApiResponse.ok`.

דוגמה:

```java
ApiResponse.ok(ApiMessages.LOGIN_SUCCESSFUL, loginResult.getUser())
ApiResponse.ok(ApiMessages.RACE_CREATED_SUCCESSFULLY, race)
ApiResponse.ok(ApiMessages.TEACHER_DASHBOARD_LOADED_SUCCESSFULLY, dashboard)
```

לא לשים כאן הודעות שגיאה של `ErrorCode`.

---

## ErrorCode ו־ErrorMessages

### ErrorCode

`ErrorCode` נשאר המקום המרכזי לשגיאות מערכת:

```java
USER_NOT_FOUND(1000, "User not found", HttpStatus.NOT_FOUND)
UNAUTHORIZED(2002, "Unauthorized", HttpStatus.UNAUTHORIZED)
FORBIDDEN(2003, "Forbidden", HttpStatus.FORBIDDEN)
```

כל שגיאה שיש לה:

```text
code + defaultMessage + HttpStatus
```

נשארת ב־`ErrorCode`.

### ErrorMessages

משמש רק להודעות Auth או הודעות שחוזרות בכמה מקומות אבל לא מצדיקות `ErrorCode` חדש.

דוגמה:

```java
ErrorMessages.INVALID_USERNAME_OR_PASSWORD
ErrorMessages.MISSING_AUTH_TOKEN
```

לא להפוך אותו למחסן של כל השגיאות.

---

## SecurityExpressions

כל ביטוי `@PreAuthorize` עובר ל־`SecurityExpressions`.

נכון:

```java
@PreAuthorize(SecurityExpressions.HAS_ROLE_TEACHER)
```

לא נכון:

```java
@PreAuthorize("hasRole('TEACHER')")
```

אם צריך ביטוי חדש, מוסיפים אותו ל־`SecurityExpressions` בשם ברור.

---

## ConfigPropertyKeys

כל שם של environment variable או property key עובר ל־`ConfigPropertyKeys`.

נכון:

```java
env.getProperty(ConfigPropertyKeys.TOKEN_SECRET)
env.getProperty(ConfigPropertyKeys.CORS_ALLOWED_ORIGINS)
```

לא נכון:

```java
env.getProperty("TOKEN_SECRET")
```

הודעות validation של config יכולות להישאר מקומיות בתוך `TokenConfig` או `CorsConfig`, אבל מומלץ להשתמש בתוך ההודעה עצמה ב־`ConfigPropertyKeys` כדי לא לשכפל שמות env.

---

## RaceRules

חוקי משחק כלליים ששייכים ל־Race או ליצירת מרוץ עוברים ל־`RaceRules`.

הערכים המומלצים כרגע:

```java
public final class RaceRules {

    public static final int ROOM_CODE_LENGTH = 6;

    public static final int MIN_TITLE_LENGTH = 2;
    public static final int MAX_TITLE_LENGTH = 60;

    public static final int MIN_PLAYERS = 1;
    public static final int MAX_PLAYERS = 8;

    public static final int MIN_TOTAL_DISTANCE = 100;
    public static final int DEFAULT_CURRENT_PLAYERS = 0;

    private RaceRules() {
    }
}
```

הערות:
- `ROOM_CODE_LENGTH` צריך להיות 6, כי זה האורך שהמערכת מייצרת ב־`RoomCodeService`.
- לא להשתמש ב־`MAX_ROOM_CODE_LENGTH = 20`, כי זה יוצר פער בין ה־DB/validation לבין הקוד שנוצר בפועל.
- כותרת מרוץ לא צריכה להיות ארוכה מדי. `MAX_TITLE_LENGTH = 60` מספיק לדשבורד ולכרטיסי מרוצים.
- אם בעתיד נרצה כותרות ארוכות יותר, משנים רק את `RaceRules.MAX_TITLE_LENGTH`.

שימוש ב־`Race`:

```java
@Size(max = RaceRules.ROOM_CODE_LENGTH)
@Column(name = "room_code", nullable = false, unique = true, length = RaceRules.ROOM_CODE_LENGTH)
private String roomCode;

@Size(min = RaceRules.MIN_TITLE_LENGTH, max = RaceRules.MAX_TITLE_LENGTH)
@Column(nullable = false, length = RaceRules.MAX_TITLE_LENGTH)
private String title;
```

שימוש ב־`CreateRaceRequest`:

```java
@NotBlank
@Size(min = RaceRules.MIN_TITLE_LENGTH, max = RaceRules.MAX_TITLE_LENGTH)
private String title;
```

שימוש ב־`RoomCodeService`:

```java
StringBuilder code = new StringBuilder(RaceRules.ROOM_CODE_LENGTH);

for (int i = 0; i < RaceRules.ROOM_CODE_LENGTH; i++) {
    int index = secureRandom.nextInt(ALLOWED_CHARS.length());
    code.append(ALLOWED_CHARS.charAt(index));
}
```

קבועים פנימיים של יצירת הקוד כמו `ALLOWED_CHARS` ו־`MAX_ATTEMPTS` יכולים להישאר `private static final` בתוך `RoomCodeService`, כי הם שייכים לאלגוריתם הפנימי של השירות.

---

## JWT ו־Cookie

### JWT

שמות claims עוברים ל־`JwtClaims`:

```java
.claim(JwtClaims.USER_ID, userId)
.claim(JwtClaims.ROLE, role)
```

לא לעשות:

```java
.claim("userId", userId)
.claim("role", role)
```

### SecurityConstants

קבועים טכניים של Spring Security:

```java
SecurityConstants.ROLE_PREFIX
```

### CookieConstants

קבועים נמוכים של Cookie:

```java
CookieConstants.EMPTY_VALUE
CookieConstants.PATH_ROOT_ATTRIBUTE
CookieConstants.MAX_AGE_ATTRIBUTE
CookieConstants.HTTP_ONLY_ATTRIBUTE
CookieConstants.SAME_SITE_ATTRIBUTE
CookieConstants.SECURE_ATTRIBUTE
```

עבור header מובנה להשתמש בקבוע של Spring:

```java
HttpHeaders.SET_COOKIE
```

---

## קבועים מקומיים במחלקה

אם הקבוע משמש רק במחלקה אחת, לא להעביר לקובץ גלובלי.

דוגמה טובה: `DataInitializer`

```java
private static final String DEV_TEACHER_USERNAME = "GojoSatoru";
private static final String DEV_TEACHER_PASSWORD = "123456";
private static final String DEV_TEACHER_DISPLAY_NAME = "Gojo Satoru";

private static final String DEFAULT_SUBJECT_CODE = "MATH";
private static final String DEFAULT_SUBJECT_NAME = "Math";
```

כלל: אם הקבוע הוא seed data או אלגוריתם פנימי של service אחד — להשאיר private באותה מחלקה.

---

## Checklist כשמוסיפים Controller חדש

```text
1. ה־path נמצא ב־ApiPaths?
2. ה־Controller משתמש ב־@RequestMapping(ApiPaths.X)?
3. אם יש הרשאות — משתמשים ב־SecurityExpressions?
4. אין בדיקות ידניות של role בתוך ה־Controller?
5. אין קריאת Cookie/JWT ידנית בתוך ה־Controller?
6. ההודעה ב־ApiResponse.ok נמצאת ב־ApiMessages?
7. ה־Controller מחזיר DTO ולא Entity?
8. הלוגיקה נמצאת ב־Service ולא ב־Controller?
9. שם ה־DTO נמצא בתיקיית dto המתאימה לפי פיצ׳ר:
   auth / race / subject / teacher
```

---

## Checklist כשמוסיפים Service חדש

```text
1. אם צריך current user — להשתמש ב־CurrentUserService.
2. לא להשתמש ב־HttpServletRequest בתוך Service רגיל.
3. לא לקרוא JWT או Cookie מתוך Service עסקי.
4. הודעות שגיאה רגילות — דרך ErrorCode / ApiException.
5. קבוע שמשמש רק ב־Service הזה — private static final.
6. חוק עסקי משותף — Rules class מתאים.
7. Repository אחראי רק DB, לא לוגיקה עסקית.
```

---

## Checklist כשמוסיפים DTO חדש

```text
1. לשים בתיקיית dto לפי הפיצ׳ר:
   dto/auth
   dto/race
   dto/subject
   dto/teacher

2. DTO של מסך מורה → dto/teacher.
3. DTO שמתאר מרוץ בודד → dto/race.
4. לא להחזיר Entity ישירות מה־Controller.
5. אם יש mapping מ־Entity ל־DTO, אפשר static from(entity) כשזה פשוט וברור.
```

---

## Checklist לפני PR

להריץ:

```bash
cd server
mvn test
```

בדיקות ידניות בסיסיות:

```text
POST /api/auth/login
GET /api/auth/me
GET /api/subjects
POST /api/teacher/races
GET /api/teacher/dashboard
POST /api/auth/logout
```

חיפוש ידני מומלץ לפני PR:

```bash
# חיפוש paths קשיחים
grep -R "\"/api" server/src/main/java

# חיפוש hasRole קשיח
grep -R "hasRole" server/src/main/java

# חיפוש הודעות הצלחה קשיחות
grep -R "successful\|loaded" server/src/main/java/com/quiz_wheelz/controller

# חיפוש JWT claims קשיחים
grep -R "\"userId\"\|\"role\"" server/src/main/java/com/quiz_wheelz/service server/src/main/java/com/quiz_wheelz/security

# חיפוש מספרי Race rules קשיחים
grep -R "@Min(1)\|@Max(8)\|@Min(100)" server/src/main/java
```

ב־PowerShell:

```powershell
Select-String -Path "server/src/main/java/**/*.java" -Pattern '"/api'
Select-String -Path "server/src/main/java/**/*.java" -Pattern 'hasRole'
Select-String -Path "server/src/main/java/com/quiz_wheelz/controller/*.java" -Pattern 'successful|loaded'
Select-String -Path "server/src/main/java/**/*.java" -Pattern '"userId"|"role"'
Select-String -Path "server/src/main/java/**/*.java" -Pattern '@Min\(1\)|@Max\(8\)|@Min\(100\)'
```
