# CLAUDE.md — QuizWheelz Stage A Working Guide

This file is for Claude Code / Claude Design when working on the QuizWheelz repository.

Project owner for this workflow: Shimon  
Partner: Diana  
Main integration branch: `develop`  
Current stage: Stage A

---

## 1. How Shimon wants to work

Shimon uses three helpers with different responsibilities:

```text
ChatGPT:
- architecture
- issue planning
- project skeleton
- task breakdown
- review thinking
- keeping Stage A scope clean

Claude Code:
- frontend implementation
- UI component implementation
- Tailwind layout
- polishing the teacher dashboard
- following the existing repo structure

Claude Design:
- visual direction
- mockups
- style ideas
- asset prompts
```

Claude Code must not replace the architecture plan.  
Claude Code should implement the current issue according to `docs/ISSUES.md`, this file, and `AGENTS.md`.

---

## 2. Project summary

QuizWheelz is a classroom educational racing game.

A teacher logs in, creates a race, receives a room code, and later projects a classroom race dashboard. Students will eventually join from phones and answer multiple-choice questions.

The server is the source of truth.  
The client displays data received from the server.

Monorepo:

```text
server/  Spring Boot, Java 21
client/  React + Vite
docs/    Project planning and issue documentation
```

---

## 3. Stage A scope

Stage A must finish this first real teacher flow:

```text
login -> teacher dashboard -> create race -> race appears -> open race room -> logout
```

### In scope for Stage A

- Teacher login.
- JWT stored in HttpOnly Cookie.
- `/api/auth/me`.
- Logout.
- Protected teacher dashboard.
- Teacher dashboard real data.
- Create race.
- Server-generated room code.
- Teacher race list.
- Basic teacher race room waiting page.
- Subject infrastructure.
- QuestionTemplate model only.

### Out of scope for Stage A

Do **not** implement:

- SSE live updates.
- PixiJS rendering.
- Full game canvas.
- Student race screen.
- Question generator algorithm.
- Scoring engine.
- Answer validation engine.
- Turbo / luck / junction events.
- Final leaderboard.
- Real-time player movement.
- Any Stage B game logic.

If a task seems to require one of these, stop and ask Shimon.

---

## 4. Real repo layout

Use the existing project structure. Do not rename folders broadly.

```text
server/src/main/java/com/quiz_wheelz/
  common/
  config/
  controller/
  dto/{auth,race,subject}/
  entitys/       // keep this typo for now
  enums/
  exception/
  repository/
  security/
  service/
  utils/
  sse/           // infrastructure only, do not use in Stage A

client/src/
  api/
  components/
    auth/
    brand/
    layout/
    teacher/
    ui/
  constants/
  errors/
  hooks/
  layouts/
  pages/
  routes/
  stores/
  styles/
```

Important naming rule:

```text
Use: entitys/
Do not rename it to: entity/ or model/
```

---

## 5. Hard rules

### Server is the source of truth

The client must not calculate:

- score
- winner
- race ownership
- question correctness
- player progress
- game events
- final ranking

The client only displays server responses.

### No Math hardcoding

Math is only the first subject.

Use:

```text
Subject
QuestionTemplate
QuestionType
Difficulty
```

Do not create central classes/components like:

```text
MathRace
MathQuestion
MathService
```

### Controllers stay thin

Controllers must not:

- read cookies manually
- validate JWT manually
- check role with `if`
- return entities directly
- contain business logic

Use:

```java
@PreAuthorize("hasRole('TEACHER')")
```

Never use:

```java
@PreAuthorize("hasRole('ROLE_TEACHER')")
```

Use `CurrentUserService` inside services when current user data is needed.

Return DTOs wrapped with:

```java
ApiResponse.ok(message, data)
```

### Frontend auth

Do not store JWT in `localStorage`.

Use the shared `httpClient` only.  
It already has `withCredentials: true`.

---

## 6. UI direction for Stage A

The UI should feel like a polished child-friendly educational racing product.

Visual direction:

- Hebrew default.
- RTL layout.
- Rounded cards.
- Soft shadows.
- Sky blue / white / purple / blue palette.
- Playful dashboard with racing visuals.
- Sidebar navigation.
- Hero banner.
- Race cards.
- Friendly empty states.
- Large clear room code in the race room page.

Reference mockups are design direction only.  
Do not use full screenshot mockups as page backgrounds.  
Build real React components.

If an asset is missing, the UI must not crash. Use a fallback gradient, emoji, or simple icon.

---

## 7. Bilingual constants rule

No user-facing Hebrew or English strings directly inside JSX.

Every new UI text must live in a constants file with both Hebrew and English keys.

Required pattern:

```js
export const CREATE_RACE_MODAL_CONTENT = {
  he: {
    title: "צור מרוץ חדש",
    submitButton: "צור מרוץ",
  },
  en: {
    title: "Create New Race",
    submitButton: "Create Race",
  },
};
```

Use Hebrew as the current default.

Use existing `languageStore` if the project already uses it.  
Do not add a new i18n library unless Shimon explicitly approves it.

Recommended files:

```text
client/src/constants/localeConstants.js
client/src/constants/teacherDashboardContent.js
client/src/constants/teacherDashboardAssets.js
client/src/constants/raceListContent.js
client/src/constants/raceStatusContent.js
client/src/constants/createRaceModalContent.js
client/src/constants/raceRoomContent.js
```

---

## 8. Visual assets

Teacher dashboard assets should be placed in:

```text
client/src/assets/teacher-dashboard/
```

Recommended filenames:

```text
gameLogo.png
teacher_dashboard_hero.png
sidebar_car_decoration.png
empty_race_state.png
quizwheelz_icon_checkered_flag.png
quizwheelz_icon_road_distance.png
quizwheelz_icon_edit_pencil.png
quizwheelz_icon_room_code_ticket.png
quizwheelz_icon_stopwatch.png
quizwheelz_icon_students_group.png
quizwheelz_icon_trophy.png
```

Create an asset registry file if useful:

```text
client/src/constants/teacherDashboardAssets.js
```

The registry should safely handle missing assets where possible.

---

## 9. Updated Stage A issue split

Read the updated issue list from:

```text
docs/ISSUES.md
```

The planned split after Issue 08 is:

```text
Issue 09A — Teacher Client Design Foundation
Issue 09B — Race List UI + Race Card
Issue 09C — Create Race Modal + API Client
Issue 10  — Teacher Dashboard API
Issue 11  — Teacher Dashboard Real Data Integration
Issue 12A — Teacher Race Room API
Issue 12B — Teacher Race Room Page UI
Issue 13  — QuestionTemplate model for multiple-choice future
Issue 14  — Stage A integration and manual testing
```

Work on one issue at a time.

---

## 10. Recommended team split

Shimon:

```text
Issue 09A — Teacher Client Design Foundation
Issue 09B — Race List UI + Race Card
Issue 09C — Create Race Modal + API Client
Issue 11  — Teacher Dashboard Real Data Integration
Issue 12B — Teacher Race Room Page UI
```

Diana:

```text
Issue 10  — Teacher Dashboard API
Issue 12A — Teacher Race Room API
Issue 13  — QuestionTemplate model
```

Together:

```text
Issue 14 — Stage A integration and manual testing
```

Claude Code should mainly help Shimon with frontend/client UI tasks unless explicitly asked otherwise.

---

## 11. Issue 09A guide — Teacher Client Design Foundation

Branch:

```text
feature/issue-09a-teacher-client-foundation
```

Goal:

Upgrade the teacher dashboard from a temporary test screen into a polished QuizWheelz-style layout foundation.

Client-only.  
No backend changes.  
No create race modal yet.

Expected new files:

```text
client/src/layouts/TeacherDashboardLayout.jsx
client/src/components/teacher/TeacherSidebar.jsx
client/src/components/teacher/TeacherTopBar.jsx
client/src/components/teacher/TeacherHeroBanner.jsx
client/src/constants/localeConstants.js
client/src/constants/teacherDashboardContent.js
client/src/constants/teacherDashboardAssets.js
```

Expected updated files:

```text
client/src/pages/TeacherDashboardPage.jsx
client/src/components/teacher/TeacherDashboardHeader.jsx
client/src/components/teacher/TeacherStatsGrid.jsx
client/src/components/teacher/TeacherStatCard.jsx
client/src/constants/teacherDashboardConstants.js
```

### TeacherDashboardLayout

- Full teacher dashboard shell.
- Sidebar + main content.
- RTL-friendly.
- Sky/soft dashboard background.
- No API calls.

### TeacherSidebar

- Logo.
- Navigation:
  - לוח מחוונים / Dashboard
  - מרוצים / Races
  - יצירת מרוץ חדש / Create Race
  - תלמידים / Students — coming soon
  - נושאים / Subjects — coming soon
  - תוצאות / Results — coming soon
  - הגדרות / Settings — coming soon
- No API calls.

### TeacherTopBar

- Teacher name.
- Role/subtitle.
- Logout action.
- Decorative notification icon only.
- No fake notification logic.

### TeacherHeroBanner

- Visual hero at top.
- Use `teacher_dashboard_hero.png` if present.
- Fallback gradient if missing.
- Text from bilingual constants.

### TeacherStatsGrid / TeacherStatCard

Only Stage A-safe stats:

- Total races.
- Active races.
- Finished races.
- Waiting races.

Do not show fake:

- generated questions
- average accuracy
- achievements
- connected students as real values

Definition of Done:

- Dashboard no longer looks like a plain test screen.
- Sidebar exists.
- TopBar exists.
- Hero banner exists.
- Stats cards are polished.
- Logout still works.
- All text is in bilingual constants.
- Build passes.
- No backend changes.

---

## 12. Issue 09B guide — Race List UI + Race Card

Branch:

```text
feature/issue-09b-race-list-ui
```

Goal:

Replace the temporary race placeholder with a real RaceList and RaceCard UI.

Client-only.

Expected new files:

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

Race shape:

```js
{
  raceId,
  title,
  roomCode,
  subjectId,
  subjectName,
  subjectCode,
  status,
  maxPlayers,
  currentPlayers,
  totalDistance,
  createdAt
}
```

### RaceList props

```text
races
isLoading
error
onCreateRaceClick
onOpenRace
onEditRace
```

### RaceListItem

Show:

- title
- subjectName
- roomCode
- status
- currentPlayers / maxPlayers
- totalDistance
- createdAt
- פתח חדר / Open Room
- ערוך / Edit only if editable

### Status labels

```text
WAITING_FOR_PLAYERS -> ממתין לתלמידים / Waiting for players
READY -> מוכן להתחלה / Ready
IN_PROGRESS -> פעיל עכשיו / In progress
FINISHED -> הסתיים / Finished
CANCELLED -> בוטל / Cancelled
```

### Edit rule

Editable:

```text
WAITING_FOR_PLAYERS
READY
```

Not editable:

```text
IN_PROGRESS
FINISHED
CANCELLED
```

Definition of Done:

- Empty state looks good.
- RaceList can render a race array.
- Race card supports `RaceSummaryResponse`.
- Status badge works.
- Edit button appears only when allowed.
- No fake save behavior.
- All text in bilingual constants.
- No server changes.

---

## 13. Issue 09C guide — Create Race Modal + API Client

Branch:

```text
feature/issue-09c-create-race-modal
```

Goal:

Build the real Create Race modal and connect it to server APIs.

Client-only.

Backend contract:

```text
GET  /api/subjects
POST /api/teacher/races
```

Create race payload:

```js
{
  title: string,
  subjectId: number,
  maxPlayers: number,
  totalDistance: number
}
```

Do not add unsupported fields:

- question type
- difficulty
- number of questions
- start mode
- time per question

Expected new files:

```text
client/src/components/teacher/CreateRaceModal.jsx
client/src/api/subjectApi.js
client/src/api/teacherApi.js
client/src/utils/createRaceValidation.js
client/src/constants/createRaceModalContent.js
```

Optional:

```text
client/src/components/ui/Modal.jsx
```

Only create `Modal.jsx` if it stays small and useful.

### Modal fields

- Race title.
- Subject select.
- Max players selector 1–8.
- Total distance presets.

Defaults:

```js
{
  title: "",
  subjectId: firstLoadedSubjectId,
  maxPlayers: 8,
  totalDistance: 1000
}
```

Distance presets:

```text
500  Short      קצר
1000 Regular    רגיל
1500 Long       ארוך
2000 Challenge  אתגר
```

Flow:

1. Teacher opens modal.
2. Subjects load.
3. Teacher fills form.
4. Submit calls `createRace`.
5. Server returns `RaceSummaryResponse`.
6. Call `onRaceCreated(newRace)`.
7. Dashboard adds new race to top of list.
8. Modal closes and resets.

API rules:

- Use existing `httpClient`.
- Do not create a new axios instance.
- Return `ApiResponse.data`.

Definition of Done:

- Modal opens and closes.
- Subjects load from server.
- Validation works.
- Race creation works.
- New race appears without refresh.
- All text in bilingual constants.
- No backend changes.

---

## 14. Issue 11 guide — Dashboard real data integration

Only start after Diana finishes Issue 10.

Client-only.

Add to `teacherApi.js`:

```js
getTeacherDashboard()
```

Dashboard state should include:

```text
dashboard
races
isLoadingDashboard
dashboardError
isCreateRaceModalOpen
```

Rules:

- Do not show fake production metrics.
- Stats must come from server or be safely derived from real races.
- Keep loading / error / empty states.
- Use bilingual constants.

Definition of Done:

- Dashboard loads real server data.
- Teacher sees only their races.
- Races persist after refresh.
- Create race still updates list.
- No Stage B features.

---

## 15. Issue 12B guide — Teacher race room page UI

Only start after Diana finishes Issue 12A.

Client-only.

Route:

```text
/teacher/races/:raceId
```

Expected files:

```text
client/src/pages/TeacherRaceRoomPage.jsx
client/src/components/teacher/RoomCodeCard.jsx
client/src/components/teacher/RaceRoomSummary.jsx
client/src/components/teacher/RacePlayerSlots.jsx
client/src/components/teacher/RaceActionsPanel.jsx
client/src/constants/raceRoomContent.js
```

Page shows:

- race title
- status
- room code large
- subject
- currentPlayers / maxPlayers
- totalDistance
- player slots 1–8
- copy code button if simple
- back to dashboard
- start race disabled / coming soon

Do not implement:

- live race
- SSE
- PixiJS
- student join
- real start race

---

## 16. Workflow for every Claude Code task

Before editing:

1. Read `AGENTS.md`.
2. Read this `CLAUDE.md`.
3. Read `docs/ISSUES.md`.
4. Run `git status`.
5. Confirm current branch.
6. Inspect files to touch.
7. Present a plan:
   - files to create
   - files to change
   - reason for each change
   - manual test plan
8. Wait for approval unless Shimon explicitly says to implement.

During editing:

- Make the smallest useful change.
- Do not refactor unrelated files.
- Do not rename folders.
- Do not add libraries without approval.
- Keep JSX text-free by using constants.
- Keep components small.
- Keep API calls in `client/src/api`.
- Keep UI state in page/store, not random utility files.

After editing:

1. Run `npm run build` for frontend tasks.
2. Run `mvn test` for backend tasks.
3. Report:
   - files changed
   - what changed
   - what passed
   - manual test steps
   - what is still TODO

---

## 17. Branch workflow

Always branch from updated `develop`.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-09a-teacher-client-foundation
```

After finishing:

```bash
git status
npm run build
git add .
git commit -m "feat(client): add teacher dashboard foundation"
git push origin feature/issue-09a-teacher-client-foundation
```

Open PR back to `develop`.

Do not start the next dependent issue until the previous PR is merged into `develop`.

---

## 18. PR checklist

Every PR should mention:

```markdown
## Summary
- What changed

## Scope
- Issue number
- Client/server

## Testing
- npm run build
- mvn test if backend
- Manual flow checked

## Stage A guardrails
- No SSE
- No PixiJS
- No game engine
- No question generator
- No fake production metrics

## UI content
- All new user-facing strings are in bilingual constants
```

---

## 19. Stop conditions

Stop and ask Shimon if:

- The issue requires a backend endpoint that does not exist.
- A UI field is not supported by the backend DTO.
- A new dependency seems needed.
- A folder/file rename seems needed.
- A change touches both Shimon and Diana work areas.
- You are about to implement Stage B behavior.
- The design mockup suggests fake data that the server does not return.
