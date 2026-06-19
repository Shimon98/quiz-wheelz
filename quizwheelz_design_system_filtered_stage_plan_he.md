# QuizWheelz — סינון Design System לפי Stage A Issues

מסמך עבודה לשמעון / דיאנה / Codex / Claude Code.  
המטרה: לקחת את מה ש־Claude Design יצר, לסנן אותו לפי Stage A, ולדעת בדיוק מה להשתמש בכל Issue.

---

## 1. מסקנה כללית

Claude Design יצר Design System רחב וטוב, אבל הוא רחב יותר ממה שצריך להכניס מייד ל־Issue 09A.

לא מכניסים הכול בבת אחת.

משתמשים בו בשלבים:

```text
09A — בסיס עיצובי לדשבורד: tokens, assets, layout, sidebar, topbar, hero, stat cards
09B — RaceList + RaceCard: card styles, badges, empty/loading/error
09C — CreateRaceModal: modal style, fields, segmented controls, buttons
11  — חיבור לנתונים אמיתיים: ללא שינוי עיצובי גדול
12B — RaceRoom Page: room code card, player slots, action panel
14  — polish: אחידות, build, responsive, ניקוי
```

---

## 2. מה קיבלנו מ־Claude Design

### קבצי root

```text
readme.md
SKILL.md
styles.css
_ds_manifest.json
_adherence.oxlintrc.json
```

### Tokens

```text
tokens/colors.css
tokens/fonts.css
tokens/typography.css
tokens/spacing.css
```

### Assets

```text
assets/icons/flag.png
assets/icons/pencil.png
assets/icons/road.png
assets/icons/stopwatch.png
assets/icons/students.png
assets/icons/ticket.png
assets/icons/trophy.png
assets/illustrations/car-finish-line.png
assets/illustrations/car-numbers-trail.png
assets/illustrations/hero-landscape.png
```

### Components ש־Claude Design יצר כדוגמה

```text
components/core/Button.jsx
components/core/Card.jsx
components/core/Badge.jsx
components/core/StatusPill.jsx
components/core/IconTile.jsx
components/core/Avatar.jsx
components/forms/TextField.jsx
components/forms/SegmentedControl.jsx
components/navigation/NavItem.jsx
components/navigation/SidebarNav.jsx
components/teacher/StatCard.jsx
```

### UI Kit

```text
ui_kits/teacher/index.html
ui_kits/teacher/kit-shell.jsx
ui_kits/teacher/kit-dashboard.jsx
ui_kits/teacher/kit-modal.jsx
ui_kits/teacher/kit-raceroom.jsx
ui_kits/teacher/kit-icons.jsx
```

---

## 3. כלל חשוב: לא מעתיקים הכול כמו שהוא

הקבצים ש־Claude Design יצר הם reference / design kit.

בפרויקט האמיתי שלנו לא בהכרח נעתיק את כל ה־components/core שלו.

הסיבה:
- הפרויקט כבר בנוי עם React + Tailwind.
- יש לנו מבנה קבצים קיים.
- יש כלל חובה: טקסטים ב־constants דו־לשוניים.
- לא רוצים להכניס Design System ענק לפני שהוא נחוץ.

לכן משתמשים בו ככה:

```text
כן לקחת:
- palette
- spacing
- radius
- shadows
- assets
- מבנה ויזואלי
- רעיונות לכרטיסים / כפתורים / badges

לא לקחת אוטומטית:
- כל קומפוננטות core
- כל CSS כגלובלי
- UI kit מלא
- modal/raceroom לפני שהגענו ל־09C/12B
```

---

## 4. Tokens שנשתמש בהם

### צבעים מרכזיים

```text
Canvas:        #EAF3FC
Sky top:       #BFE4FF
Sky bottom:    #EAF6FF
Primary blue:  #2B8CF0
Primary hover: #1E7BE6
Primary strong:#1565D1
Purple accent: #8B5CF6
Go green:      #22C55E
Waiting amber: #F59E0B
Danger red:    #EF4444
Text heading:  #1B2A41
Text body:     #334155
Text muted:    #64748B
Border card:   #E6EEF7
White:         #FFFFFF
```

### Radius

```text
small badges: 8px
buttons/inputs: 12px
nav items: 16px
cards: 20px
large panels: 24px
feature surfaces: 32px
pill: 999px
```

### Shadows

```text
card:    0 8px 24px rgba(27, 42, 65, 0.08)
large:   0 16px 40px rgba(27, 42, 65, 0.12)
modal:   0 24px 60px rgba(27, 42, 65, 0.18)
primary: 0 8px 18px rgba(30, 123, 230, 0.35)
go:      0 8px 18px rgba(34, 197, 94, 0.35)
```

### טיפוגרפיה

```text
UI font: Rubik
Display font: Baloo 2
Default body: 15px
H2 / hero: 28px
Big stat: 40px
Room code: 48px
```

אם לא רוצים להוסיף Google Fonts כרגע, להשתמש ב־font-family fallback קיים ולשמור את ההחלטה ל־polish.

---

## 5. Issue 09A — מה לוקחים מה־Design System

### מטרה

לבנות בסיס דשבורד יפה: Layout, Sidebar, TopBar, HeroBanner, Stats.

### להשתמש עכשיו

```text
tokens/colors.css — כבסיס לצבעים
tokens/spacing.css — כבסיס לרדיוסים וצללים
tokens/typography.css — כבסיס לפונטים וגדלים
assets/illustrations/hero-landscape.png
assets/illustrations/car-numbers-trail.png
assets/icons/flag.png
assets/icons/trophy.png
assets/icons/road.png
assets/icons/stopwatch.png
components/teacher/StatCard.jsx — כהשראה בלבד, לא חובה להעתיק
ui_kits/teacher/kit-shell.jsx — השראה ל־Layout/Sidebar/TopBar/Hero
ui_kits/teacher/kit-dashboard.jsx — השראה ל־StatsGrid בלבד
```

### לא להשתמש עכשיו

```text
kit-modal.jsx
kit-raceroom.jsx
SegmentedControl
TextField
RaceListItem מתוך kit-dashboard אם הוא כולל רשימת מרוצים אמיתית
```

אלה שייכים ל־09B/09C/12B.

### קבצים בפרויקט האמיתי

```text
client/src/layouts/TeacherDashboardLayout.jsx
client/src/components/teacher/TeacherSidebar.jsx
client/src/components/teacher/TeacherTopBar.jsx
client/src/components/teacher/TeacherHeroBanner.jsx
client/src/components/teacher/TeacherStatsGrid.jsx
client/src/components/teacher/TeacherStatCard.jsx
client/src/constants/teacherDashboardContent.js
client/src/constants/teacherDashboardAssets.js
client/src/constants/localeConstants.js
```

### עקרונות עיצוב ל־09A

```text
רקע עמוד: sky/canvas
Sidebar: רוחב בערך 264px בדסקטופ
Main content: max width בערך 1320px
Hero: surface גדול ומאויר, לא צילום מסך כרקע
Cards: לבן, radius 20–24, shadow רך
Stats: 4 כרטיסים בדסקטופ, 2 בטאבלט, 1 במובייל
```

### DoD עיצובי

```text
העמוד לא נראה כמו מסך בדיקה
יש Layout אמיתי
יש Sidebar
יש TopBar
יש Hero
יש 4 כרטיסי סטטיסטיקה Stage-A-safe
אין Modal
אין RaceList חדש
אין API חדש
כל טקסט ב־constants דו־לשוניים
```

---

## 6. Issue 09B — Race List UI + Race Card

### להשתמש מתוך Design System

```text
components/core/Card.jsx — השראה לכרטיסים
components/core/Badge.jsx — השראה ל־roomCode/subject badges
components/core/StatusPill.jsx — השראה לסטטוסים
ui_kits/teacher/kit-dashboard.jsx — השראה ל־RaceListItem
assets/icons/ticket.png
assets/icons/road.png
assets/icons/students.png
assets/icons/pencil.png
assets/icons/flag.png
```

### ליצור בפרויקט

```text
client/src/components/teacher/RaceList.jsx
client/src/components/teacher/RaceListItem.jsx
client/src/components/teacher/RaceStatusBadge.jsx
client/src/components/ui/EmptyState.jsx
client/src/components/ui/LoadingState.jsx
client/src/components/ui/ErrorMessage.jsx
client/src/utils/raceStatusUtils.js
client/src/utils/formatDate.js
client/src/constants/raceListContent.js
client/src/constants/raceStatusContent.js
```

### עקרונות

```text
RaceList הוא container בלבד — בלי API
RaceListItem מקבל race ומציג אותו
StatusBadge מתרגם status מהשרת
Edit מופיע רק אם canEditRace(status)
```

### סטטוסים

```text
WAITING_FOR_PLAYERS -> ממתין לתלמידים / Waiting for players
READY               -> מוכן להתחלה / Ready
IN_PROGRESS         -> פעיל עכשיו / In progress
FINISHED            -> הסתיים / Finished
CANCELLED           -> בוטל / Cancelled
```

---

## 7. Issue 09C — Create Race Modal + API Client

### להשתמש מתוך Design System

```text
ui_kits/teacher/kit-modal.jsx — השראה ל־Modal
components/forms/TextField.jsx — השראה לשדה input/select
components/forms/SegmentedControl.jsx — השראה לבחירת maxPlayers/distance
components/core/Button.jsx — השראה לכפתורים
assets/illustrations/car-numbers-trail.png
assets/icons/flag.png
assets/icons/road.png
assets/icons/students.png
```

### לא להעתיק אחד לאחד

ב־kit-modal יש שדות כמו:
```text
mode / מצב התחלה
subject hardcoded
players demo
```

לא להכניס שדות שלא קיימים ב־CreateRaceRequest.

### DTO אמיתי

```js
{
  title,
  subjectId,
  maxPlayers,
  totalDistance
}
```

### ליצור בפרויקט

```text
client/src/components/teacher/CreateRaceModal.jsx
client/src/api/subjectApi.js
client/src/api/teacherApi.js
client/src/utils/createRaceValidation.js
client/src/constants/createRaceModalContent.js
```

---

## 8. Issue 11 — Dashboard Real Data Integration

### להשתמש מה־Design System

בעיקר הקומפוננטות שכבר יצרנו ב־09A/09B/09C.

לא מוסיפים עיצוב חדש גדול.

### מטרה

```text
GET /api/teacher/dashboard
dashboard state
stats אמיתיים
races אמיתיים
create race עדיין מוסיף לרשימה
```

### חשוב

לא להשתמש במדדים שה־Design System הזכיר כהשראה אם אין להם API:
```text
accuracy
generated questions
achievements
live connected students
```

---

## 9. Issue 12B — Teacher Race Room Page UI

### להשתמש מתוך Design System

```text
ui_kits/teacher/kit-raceroom.jsx — השראה עיקרית
assets/icons/ticket.png
assets/icons/students.png
assets/icons/road.png
assets/icons/stopwatch.png
assets/icons/trophy.png
assets/illustrations/car-finish-line.png
```

### ליצור בפרויקט

```text
client/src/pages/TeacherRaceRoomPage.jsx
client/src/components/teacher/RoomCodeCard.jsx
client/src/components/teacher/RaceRoomSummary.jsx
client/src/components/teacher/RacePlayerSlots.jsx
client/src/components/teacher/RaceActionsPanel.jsx
client/src/constants/raceRoomContent.js
```

### חשוב

Stage A בלבד:
```text
סלוטים ריקים עד 8
קוד חדר גדול
Start Race disabled / coming soon
אין SSE
אין תלמידים חיים
אין מסך משחק
```

---

## 10. מה לעשות עם components/core של Claude Design

לא להעתיק את כל Design System עכשיו.

אפשרות מומלצת:

### ב־09A

לא ליצור:
```text
Button.jsx
Card.jsx
Badge.jsx
IconTile.jsx
```

במקום זה:
```text
לשפר TeacherStatCard ישירות
להשתמש Tailwind classes
להגדיר constants/assets
```

### מתי כן ליצור UI primitives?

רק אם Codex/Claude Code מרגיש שיש כפילות גבוהה.

אז ליצור בהדרגה:
```text
client/src/components/ui/AppCard.jsx
client/src/components/ui/AppButton.jsx
client/src/components/ui/StatusPill.jsx
```

אבל לא כחלק חובה מ־09A.

---

## 11. הוראות לקודקס / Claude Code ל־09A

```text
Read AGENTS.md.
Read CLAUDE.md.
Read docs/ISSUES.md.
Read this filtered design plan.

We are implementing Issue 09A only.

Use the Design System only as visual guidance:
- colors
- radius
- shadows
- assets
- layout direction
- stat card direction

Do not copy the whole design system.
Do not implement 09B, 09C, 11, 12B.
Do not implement modal.
Do not implement race list.
Do not add backend.
Do not add libraries.
Do not add Stage B features.

First inspect existing files and give a plan.
Do not modify files until approved.
```

---

## 12. הוראות לקודקס / Claude Code אחרי אישור

```text
Approved.

Implement Issue 09A only.

Requirements:
- TeacherDashboardLayout
- TeacherSidebar
- TeacherTopBar
- TeacherHeroBanner
- polished TeacherStatsGrid / TeacherStatCard
- bilingual constants
- asset registry
- fallback if assets are missing
- keep logout working
- keep existing TeacherRaceListPreview untouched unless only moving it inside the new layout
- run npm run build

Use Hebrew default via existing languageStore if possible.
```

---

## 13. מה לדחות

```text
CreateRaceModal -> 09C
RaceList/RaceCard -> 09B
Room page -> 12B
QuestionTemplate -> 13
Dashboard API integration -> 11
Live game -> Stage B
SSE -> Stage B
PixiJS -> Stage B
Student screen -> Stage B
Question generator -> Stage B
```

---

## 14. סיכום קצר

Claude Design עשה עבודה טובה כ־reference.

אנחנו לא מכניסים את הכול בבת אחת.

הדרך הנכונה:
```text
Design tokens + assets + layout direction -> 09A
Race list ideas -> 09B
Modal ideas -> 09C
Race room ideas -> 12B
Full UI polish -> 14
```
