# Stage A Issues

This file tracks the Stage A work split between Shimon and Diana.

Fill the owner/status fields as you start working.

Status options:

```text
TODO
IN_PROGRESS
REVIEW
DONE
BLOCKED
```

---

## Stage A Working Rules

Stage A must finish the first real teacher flow before the project moves to Stage B.

Stage A includes:

- Teacher login with JWT Cookie.
- Protected teacher dashboard.
- Teacher race creation.
- Server-generated room code.
- Teacher race list.
- Basic teacher race room page.
- Subject infrastructure.
- QuestionTemplate infrastructure for future multiple-choice questions.

Stage A does **not** include yet:

- SSE live race dashboard.
- PixiJS race rendering.
- Full student race screen.
- Game engine.
- Question generator algorithm.
- Turbo, luck events, junctions, highway/dirt-road logic.
- Final leaderboard and real race statistics.

---

## Client UI / Content Rules

Every new client UI component must keep user-facing text outside the JSX.

For every new text group, create constants with Hebrew and English content.

Recommended pattern:

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

Use Hebrew as the current default UI language.

Do not add an i18n library in Stage A unless the team explicitly approves it.

Recommended constants files for the client:

```text
client/src/constants/localeConstants.js
client/src/constants/teacherDashboardContent.js
client/src/constants/createRaceModalContent.js
client/src/constants/raceListContent.js
client/src/constants/raceStatusContent.js
client/src/constants/raceRoomContent.js
client/src/constants/teacherDashboardAssets.js
```

---

## Client Visual Assets

Teacher dashboard assets should be placed under:

```text
client/src/assets/teacher-dashboard/
```

Recommended asset names:

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

If an asset is missing, the UI must not crash. Use a fallback icon, emoji, or gradient.

Reference images such as dashboard mockups should be used as design direction, not as full-page image backgrounds.

---

## Issue 01 — User model, Role enum, Seed teacher

Owner: SHIMON  
Status: DONE
Branch: `feature/issue-01-user-role-model`

### Goal

Create the base user model for teacher/admin login.

### Expected files

- `server/model/User.java`
- `server/enums/UserRole.java`
- `server/repository/UserRepository.java`
- `server/config/DataInitializer.java`

### Definition of Done

- User entity exists.
- UserRole enum exists with `TEACHER`, `ADMIN`.
- Teacher seed exists for development.
- Password is hashed or prepared for hashing.
- Repository can find user by username.

---

## Issue 02 — Login page and LoginForm

Owner: SHIMON  
Status: DONE
Branch: `feature/issue-02-login-page`

### Goal

Create the basic teacher login UI.

### Expected files

- `client/src/pages/LoginPage.jsx`
- `client/src/components/auth/LoginForm.jsx`
- `client/src/api/authApi.js`

### Definition of Done

- Login page renders.
- Username/password fields exist.
- Basic validation exists.
- Error can be shown to user.
- Submit function is ready to call API.

---

## Issue 03 — JwtService and CookieUtils

Owner: DIANA  
Status: DONE 
Branch: `feature/issue-03-jwt-cookie-auth`

### Goal

Build JWT creation/validation and Cookie helpers.

### Expected files

- `server/service/JwtService.java`
- `server/utils/CookieUtils.java`
- `server/config/AppConfig.java` or existing config/constants files
- `application.properties`

### Definition of Done

- JWT can be created.
- JWT can be validated.
- Username/userId/role can be extracted.
- Auth Cookie can be created.
- Auth Cookie can be cleared.
- Cookie value can be read from `HttpServletRequest`.

---

## Issue 04 — AuthController and real login connection

Owner: DIANA  
Status: DONE 
Branch: `feature/issue-04-auth-controller`

### Goal

Create login/logout/me endpoints and connect frontend API.

### Expected files

- `server/controller/AuthController.java`
- `server/service/AuthService.java`
- `client/src/api/apiClient.js`
- `client/src/api/authApi.js`
- `client/src/stores/useAuthStore.js`

### Definition of Done

- `POST /api/auth/login` works.
- Cookie is created in browser.
- `GET /api/auth/me` returns connected user.
- `POST /api/auth/logout` clears Cookie.
- Frontend uses `withCredentials: true`.

---

## Issue 05 — ProtectedRoute and auth state

Owner: DIANA  
Status: DONE 
Branch: `feature/issue-05-protected-route`

### Goal

Protect teacher routes on the client.

### Expected files

- `client/src/components/layout/ProtectedRoute.jsx`
- `client/src/routes/AppRoutes.jsx`
- `client/src/stores/useAuthStore.js`

### Definition of Done

- Unauthenticated user cannot enter teacher dashboard.
- Authenticated teacher can enter dashboard.
- Refresh calls `/api/auth/me`.
- Logout resets auth state.
- Manual verification completed on develop.

Existing files used:

- `client/src/routes/ProtectedRoute.jsx`
- `client/src/routes/RoleRoute.jsx`
- `client/src/routes/AppRouter.jsx`
- `client/src/stores/authStore.js`

---

## Issue 06 — Subject entity and endpoint

Owner: SHIMON  
Status: DONE  
Branch: `feature/issue-06-subject-endpoint`

### Goal

Add generic subjects so the project is not hardcoded to Math.

### Expected files

- `server/model/Subject.java`
- `server/repository/SubjectRepository.java`
- `server/service/SubjectService.java`
- `server/controller/SubjectController.java`
- `server/dto/response/SubjectResponse.java`
- `server/config/DataInitializer.java`

### Definition of Done

- Subject entity exists.
- Math exists as DB seed row, not hardcoded class.
- `GET /api/subjects` returns active subjects.

---

## Issue 06A — Server Security Foundation: JWT Cookie Filter + Role Authorization

Owner: SHIMON & DIANA  
Status: DONE  
Branch: `feature/issue-06a-server-security-foundation`

### Goal

Create a central server-side security foundation before continuing with future features.

Instead of every controller manually extracting the auth cookie and validating the token, every protected request should pass through one central security flow:

```text
Cookie -> JWT -> User from DB -> active user validation -> SecurityContext -> Controller
```

After this issue, future controllers should be protected using annotations such as:

```java
@PreAuthorize("hasRole('TEACHER')")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
```

### Definition of Done

- JWT Cookie requests are authenticated through a central filter.
- Protected endpoints do not manually validate JWT in controllers.
- Role checks use Spring Security and `@PreAuthorize`.
- Unauthenticated protected requests return `401` JSON responses.
- Authenticated users without permission return `403` JSON responses.
- `CurrentUserService` is used when services need the logged-in user.

---

## Issue 07 — Race entity, RaceStatus, Repository

Owner: DIANA  
Status: DONE
Branch: `feature/issue-07-race-entity`

### Goal

Create the base Race model.

### Expected files

- `server/model/Race.java`
- `server/enums/RaceStatus.java`
- `server/repository/RaceRepository.java`

### Definition of Done

- Race can be saved with teacher and subject.
- Race has roomCode, title, status, maxPlayers, totalDistance.
- RaceStatus is enum, not string.

---

## Issue 08 — RoomCodeService and Create Race API

Owner: DIANA  
Status: DONE  
Branch: `feature/issue-08-create-race-api`

### Goal

Allow connected teacher to create race.

### Expected files

- `server/service/RoomCodeService.java`
- `server/service/RaceService.java`
- `server/controller/TeacherRaceController.java`
- `server/dto/request/CreateRaceRequest.java`
- `server/dto/response/RaceSummaryResponse.java`

### Definition of Done

- `POST /api/teacher/races` works.
- Only connected teacher can create race.
- `roomCode` is generated by server.
- `maxPlayers` limited to 8.
- Race saved in DB.

---

## Issue 09A — Teacher Client Design Foundation

Owner: SHIMON  
Status: TODO  
Branch: `feature/issue-09a-teacher-client-foundation`

### Goal

Upgrade the teacher dashboard from a temporary test screen into a polished QuizWheelz-style layout foundation.

This issue is client-only.

Do not implement race creation API calls in this issue.

### Design direction

- Playful children educational racing dashboard.
- RTL Hebrew UI.
- Light sky background.
- White rounded cards.
- Purple/blue primary action colors.
- Large spacing and soft shadows.
- Use visual assets when available.
- Use fallbacks when assets are missing.

### Expected new files

- `client/src/layouts/TeacherDashboardLayout.jsx`
- `client/src/components/teacher/TeacherSidebar.jsx`
- `client/src/components/teacher/TeacherTopBar.jsx`
- `client/src/components/teacher/TeacherHeroBanner.jsx`
- `client/src/constants/localeConstants.js`
- `client/src/constants/teacherDashboardContent.js`
- `client/src/constants/teacherDashboardAssets.js`

### Expected updated files

- `client/src/pages/TeacherDashboardPage.jsx`
- `client/src/components/teacher/TeacherDashboardHeader.jsx`
- `client/src/components/teacher/TeacherStatsGrid.jsx`
- `client/src/components/teacher/TeacherStatCard.jsx`
- `client/src/constants/teacherDashboardConstants.js`

### Component plan

#### `TeacherDashboardLayout`

Responsibilities:

- Wrap the full teacher dashboard.
- Create sidebar + main content layout.
- Keep `dir="rtl"` or RTL-friendly layout.
- Provide the sky/soft dashboard background.
- No API calls.

Design:

- Full-screen minimum height.
- Sidebar column plus main content area.
- Rounded main dashboard surface if needed.
- Responsive behavior for smaller screens.

#### `TeacherSidebar`

Responsibilities:

- Show QuizWheelz logo.
- Show navigation items.
- Mark the active item.
- Provide a create-race shortcut if needed.
- Show disabled future sections clearly as `בקרוב` / `Coming soon`.
- No API calls.

Navigation items:

- Dashboard / `לוח מחוונים`
- My races / `מרוצים`
- Create race / `יצירת מרוץ חדש`
- Students / `תלמידים` — future
- Subjects / `נושאים` — future
- Results / `תוצאות` — future
- Settings / `הגדרות` — future

#### `TeacherTopBar`

Responsibilities:

- Show teacher name.
- Show role/subtitle.
- Show logout action.
- Optional decorative notification icon only.
- No fake notification logic.

#### `TeacherHeroBanner`

Responsibilities:

- Show a large visual banner at top of the dashboard.
- Use `teacher_dashboard_hero.png` if available.
- Keep enough empty space for Hebrew text overlay.

Suggested text:

- Hebrew: `שלום מורה!`
- English: `Hello Teacher!`
- Hebrew subtitle: `ברוך הבא לדשבורד המרוצים שלך`
- English subtitle: `Welcome to your race dashboard`

#### `TeacherStatsGrid` / `TeacherStatCard`

Responsibilities:

- Show Stage A-safe stats only.
- Accept stat objects with label, value, helper text, icon/image.
- Do not show fake generated questions, accuracy, achievements, or connected students as real values.

Stage A stats:

- Total races / `סה״כ מרוצים`
- Active races / `מרוצים פעילים`
- Finished races / `מרוצים שהסתיימו`
- Waiting races / `ממתינים לתלמידים`

### Constants requirements

All labels, button text, subtitles, nav items, empty texts, and helper texts must exist in constants with Hebrew and English versions.

### Definition of Done

- Dashboard no longer looks like a plain test screen.
- Sidebar exists.
- Top bar exists.
- Hero banner exists.
- Stats cards are visually polished.
- Logout still works.
- All new UI text is stored in bilingual constants.
- Page works even if assets are missing.
- No new backend code.
- No create-race modal yet.
- No SSE/PixiJS/game logic.

---

## Issue 09B — Race List UI + Race Card

Owner: SHIMON  
Status: TODO  
Branch: `feature/issue-09b-race-list-ui`

### Goal

Replace the temporary race list placeholder with a real race list area and reusable race card.

This issue is client-only.

Do not connect the dashboard API yet unless it already exists and is approved for this issue.

### Expected new files

- `client/src/components/teacher/RaceList.jsx`
- `client/src/components/teacher/RaceListItem.jsx`
- `client/src/components/teacher/RaceStatusBadge.jsx`
- `client/src/components/ui/EmptyState.jsx`
- `client/src/components/ui/LoadingState.jsx`
- `client/src/components/ui/ErrorMessage.jsx`
- `client/src/utils/raceStatusUtils.js`
- `client/src/utils/formatDate.js`
- `client/src/constants/raceListContent.js`
- `client/src/constants/raceStatusContent.js`

### Expected updated files

- `client/src/pages/TeacherDashboardPage.jsx`
- `client/src/constants/teacherDashboardContent.js`
- `client/src/constants/teacherDashboardAssets.js`

### Race data shape to support

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

### Component plan

#### `RaceList`

Props:

- `races`
- `isLoading`
- `error`
- `onCreateRaceClick`
- `onOpenRace`
- `onEditRace`

Responsibilities:

- Show container title.
- Show description.
- Show create race button.
- Show loading state.
- Show error state.
- Show empty state.
- Render `RaceListItem` for each race.
- No API calls.

Design:

- White rounded dashboard card.
- Header row with title and action button.
- Empty state with illustration if available.
- Grid/list that looks good at desktop width.

#### `RaceListItem`

Props:

- `race`
- `onOpen`
- `onEdit`

Responsibilities:

- Show race title.
- Show subject name.
- Show room code.
- Show status badge.
- Show current players / max players.
- Show total distance.
- Show created date.
- Show `פתח חדר` / `Open Room` button.
- Show edit button only if `canEditRace(status)` is true.

Design:

- Rounded race card.
- Race icon/thumbnail area.
- Strong room code display.
- Action buttons on the side/bottom.
- Status badge visible and readable.

#### `RaceStatusBadge`

Responsibilities:

- Convert backend status enum to readable label.
- Apply tone/style by status.

Status labels:

- `WAITING_FOR_PLAYERS` → `ממתין לתלמידים` / `Waiting for players`
- `READY` → `מוכן להתחלה` / `Ready`
- `IN_PROGRESS` → `פעיל עכשיו` / `In progress`
- `FINISHED` → `הסתיים` / `Finished`
- `CANCELLED` → `בוטל` / `Cancelled`

#### `raceStatusUtils`

Functions:

- `getRaceStatusLabel(status, locale)`
- `getRaceStatusTone(status)`
- `canEditRace(status)`

Edit rule:

```text
Editable:
WAITING_FOR_PLAYERS
READY

Not editable:
IN_PROGRESS
FINISHED
CANCELLED
```

### Constants requirements

All RaceList text, RaceCard labels, status labels, button text, empty states, and error/loading messages must exist in bilingual constants.

### Definition of Done

- Race list renders empty state beautifully.
- Race list can render a provided races array.
- Race card supports all fields from `RaceSummaryResponse`.
- Status badge works in Hebrew and English through constants.
- Edit button appears only for editable statuses.
- No fake save behavior.
- Dashboard uses the new `RaceList` instead of the old placeholder.
- No server changes.
- No SSE/PixiJS/game logic.

---

## Issue 09C — Create Race Modal + API Client

Owner: SHIMON  
Status: TODO  
Branch: `feature/issue-09c-create-race-modal`

### Goal

Build a real Create Race modal that loads subjects from the server and creates a race through the teacher API.

This issue is client-only.

### Backend contract

`GET /api/subjects`

`POST /api/teacher/races`

Create race payload:

```js
{
  title: string,
  subjectId: number,
  maxPlayers: number,
  totalDistance: number
}
```

Backend validation:

- `title` is required and max 120 characters.
- `subjectId` is required.
- `maxPlayers` is between 1 and 8.
- `totalDistance` is at least 100.

### Expected new files

- `client/src/components/teacher/CreateRaceModal.jsx`
- `client/src/api/subjectApi.js`
- `client/src/api/teacherApi.js`
- `client/src/utils/createRaceValidation.js`
- `client/src/constants/createRaceModalContent.js`

### Optional new file

- `client/src/components/ui/Modal.jsx`

Create `Modal.jsx` only if it clearly reduces duplication and stays small.

### Expected updated files

- `client/src/pages/TeacherDashboardPage.jsx`
- `client/src/components/teacher/RaceList.jsx`
- `client/src/components/teacher/TeacherSidebar.jsx`
- `client/src/constants/teacherDashboardContent.js`

### Component plan

#### `CreateRaceModal`

Props:

- `isOpen`
- `onClose`
- `onRaceCreated`

State:

- `form`
- `subjects`
- `isLoadingSubjects`
- `isSubmitting`
- `error`
- `fieldErrors`

Fields:

- Race title.
- Subject select.
- Max players selector from 1 to 8.
- Total distance presets.

Default values:

```js
{
  title: "",
  subjectId: firstLoadedSubjectId,
  maxPlayers: 8,
  totalDistance: 1000
}
```

Suggested distance presets:

- 500 / Short / `קצר`
- 1000 / Regular / `רגיל`
- 1500 / Long / `ארוך`
- 2000 / Challenge / `אתגר`

Design:

- Centered modal.
- Dark translucent page overlay.
- Rounded white card.
- Large title and small race car/checkered flag visual.
- Clear cancel and submit buttons.
- Loading state on submit.
- Error message inside modal.

### API plan

#### `subjectApi.js`

Function:

- `getActiveSubjects()`

Rules:

- Use existing `httpClient`.
- Do not create a new axios instance.
- Return the actual subjects array from the server `ApiResponse.data`.

#### `teacherApi.js`

Function:

- `createRace(payload)`

Rules:

- Use existing `httpClient`.
- Do not create a new axios instance.
- Return the actual `RaceSummaryResponse` from the server `ApiResponse.data`.

### Flow

1. Teacher clicks create race from dashboard/sidebar.
2. Modal opens.
3. Subjects load from server.
4. Teacher fills race title, subject, max players, and distance.
5. Submit calls `createRace(payload)`.
6. Server returns `RaceSummaryResponse`.
7. Modal calls `onRaceCreated(newRace)`.
8. Dashboard adds the new race to the top of the list without manual refresh.
9. Modal closes and resets.

### Out of scope

Do not add these fields because the backend request does not support them yet:

- Question type.
- Difficulty.
- Number of questions.
- Start mode.
- Time per question.

### Constants requirements

All modal titles, field labels, placeholders, validation messages, loading messages, error messages, preset labels, and buttons must exist in bilingual constants.

### Definition of Done

- Modal opens from dashboard.
- Modal opens from sidebar create shortcut if the shortcut exists.
- Modal closes with cancel and X button.
- Subjects are loaded from server.
- Teacher can enter title.
- Teacher can choose subject.
- Teacher can choose maxPlayers from 1 to 8.
- Teacher can choose totalDistance.
- Client-side validation exists.
- `POST /api/teacher/races` works.
- New race appears without manual refresh.
- All new UI text is stored in bilingual constants.
- No server changes.
- No SSE/PixiJS/game logic.

---

## Issue 10 — Teacher Dashboard API

Owner: DIANA  
Status: DONE  
Branch: `feature/issue-10-teacher-dashboard-api`

### Goal

Create backend endpoint for teacher dashboard real data.

### Expected files

- `server/controller/TeacherDashboardController.java`
- `server/service/TeacherDashboardService.java`
- `server/dto/teacher/TeacherDashboardResponse.java`

If the project keeps DTOs under another package, follow the existing project convention.

### Endpoint

```text
GET /api/teacher/dashboard
```

### Suggested response shape

```js
{
  teacherName,
  totalRaces,
  activeRaces,
  finishedRaces,
  waitingRaces,
  races
}
```

`races` should be a list of `RaceSummaryResponse`.

### Security rules

- Use `@PreAuthorize("hasRole('TEACHER')")`.
- Use `CurrentUserService` to get the connected teacher.
- Do not extract Cookie manually.
- Do not validate JWT manually.
- Do not check role with `if` in the controller.

### Service plan

`TeacherDashboardService` should:

- Get current teacher id from `CurrentUserService`.
- Load active teacher using `UserService` if needed.
- Load only races owned by that teacher.
- Calculate counts from the teacher's races.
- Return DTOs only, not entities.

### Definition of Done

- `GET /api/teacher/dashboard` works.
- Returns teacher name.
- Returns total races count.
- Returns active races count.
- Returns finished races count.
- Returns waiting races count if easy to compute.
- Returns only races owned by the connected teacher.
- Does not return races owned by other teachers.
- Uses central security correctly.
- Protected request without login returns `401` JSON.
- Request with wrong role returns `403` JSON.

---

## Issue 11 — Teacher Dashboard Real Data Integration

Owner: SHIMON  
Status: TODO  
Branch: `feature/issue-11-teacher-dashboard-real-data`

### Goal

Connect the polished teacher dashboard to the real teacher dashboard API.

This issue is client-only.

### Expected updated files

- `client/src/api/teacherApi.js`
- `client/src/pages/TeacherDashboardPage.jsx`
- `client/src/components/teacher/TeacherStatsGrid.jsx`
- `client/src/components/teacher/RaceList.jsx`
- `client/src/constants/teacherDashboardContent.js`

### API plan

Add to `teacherApi.js`:

- `getTeacherDashboard()`
- Keep `createRace(payload)` from Issue 09C.

Use existing `httpClient` only.

### Page state plan

`TeacherDashboardPage` should keep:

- `dashboard`
- `races`
- `isLoadingDashboard`
- `dashboardError`
- `isCreateRaceModalOpen`

### Flow

1. Page mounts.
2. Client calls `GET /api/teacher/dashboard`.
3. Stats are rendered from response.
4. Race list is rendered from response.
5. Create race still works.
6. After create race success, either:
   - add the new race locally and update counts, or
   - refetch dashboard.

Choose the simpler safer option based on the final API behavior.

### Data rules

Do not show these as real stats unless the server returns real values:

- Generated questions.
- Average accuracy.
- Achievements.
- Connected students.
- Monthly progress.

Future-only placeholders are allowed only if clearly marked as `בקרוב` / `Coming soon`.

### Constants requirements

All loading, error, empty, stat, and dashboard labels must exist in bilingual constants.

### Definition of Done

- Dashboard loads real data from server.
- Teacher sees only their races.
- Race list persists after refresh.
- Stats are real or safely derived from real races.
- Create race still adds the new race to the list.
- Loading state exists.
- Error state exists.
- Empty state exists.
- No fake production metrics.
- No server changes.
- No SSE/PixiJS/game logic.

---

## Issue 12A — Teacher Race Room API

Owner: DIANA  
Status: DONE  
Branch: `feature/issue-12a-teacher-race-room-api`

### Goal

Create backend endpoint for the basic teacher race room page.

This is not the live race endpoint.

This issue does not implement SSE or race start.

### Expected files

- `server/controller/TeacherRaceController.java`
- `server/service/RaceService.java`
- `server/dto/race/TeacherRaceRoomResponse.java`

If the project keeps DTOs under another package, follow the existing project convention.

### Endpoint

```text
GET /api/teacher/races/{raceId}/room
```

### Suggested response shape

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
  createdAt,
  players
}
```

For Stage A, `players` can be an empty list if player join is not implemented yet.

### Security rules

- Use `@PreAuthorize("hasRole('TEACHER')")`.
- Use `CurrentUserService` in service layer.
- Teacher can access only races they created.
- Do not extract Cookie manually.
- Do not validate JWT manually.
- Do not check role with `if` in the controller.

### Definition of Done

- Endpoint works for a race owned by the connected teacher.
- Response includes race title, roomCode, subject, status, current players, max players, total distance, and created date.
- Teacher cannot access a race owned by another teacher.
- Missing race returns a clean `404` response.
- Protected request without login returns `401` JSON.
- Wrong role returns `403` JSON.
- No SSE.
- No game engine.
- No start race logic.

---

## Issue 12B — Teacher Race Room Page UI

Owner: SHIMON  
Status: TODO  
Branch: `feature/issue-12b-teacher-race-room-page`

### Goal

Create a polished but basic teacher race room waiting page.

The visual direction should follow the teacher waiting-room mockup, but the functionality stays Stage A only.

This issue is client-only.

### Expected new files

- `client/src/pages/TeacherRaceRoomPage.jsx`
- `client/src/components/teacher/RoomCodeCard.jsx`
- `client/src/components/teacher/RaceRoomSummary.jsx`
- `client/src/components/teacher/RacePlayerSlots.jsx`
- `client/src/components/teacher/RaceActionsPanel.jsx`
- `client/src/constants/raceRoomContent.js`

### Expected updated files

- `client/src/api/teacherApi.js`
- `client/src/components/teacher/RaceListItem.jsx`
- `client/src/constants/routeConstants.js`
- `client/src/routes/AppRouter.jsx`

### Route

```text
/teacher/races/:raceId
```

Add route helper if useful.

### Component plan

#### `TeacherRaceRoomPage`

Responsibilities:

- Read `raceId` from route params.
- Load room data from `teacherApi.getTeacherRaceRoom(raceId)`.
- Show loading, error, and content states.
- Provide back to dashboard action.

#### `RoomCodeCard`

Responsibilities:

- Display the room code very large.
- Explain that students should use this code to join.
- Provide copy code button if simple.
- QR can be placeholder only if QR implementation is not available.

#### `RaceRoomSummary`

Responsibilities:

- Display subject, status, max players, current players, total distance, created date.
- Use `RaceStatusBadge` if available.

#### `RacePlayerSlots`

Responsibilities:

- Show 1 to 8 player slots based on max players.
- In Stage A, empty slots can show `ממתין לתלמיד...` / `Waiting for student...`.
- Do not implement real student join if backend is not ready.

#### `RaceActionsPanel`

Responsibilities:

- Show Start Race button as disabled / coming soon.
- Show future actions as disabled if needed.
- No live game actions yet.

### Constants requirements

All room page text, labels, button text, helper text, placeholder text, copy messages, and errors must exist in bilingual constants.

### Definition of Done

- Clicking `פתח חדר` from a race card navigates to `/teacher/races/:raceId`.
- Room page loads real room data from server.
- Room code is large and clear.
- Race summary is visible.
- Player slots are visible up to maxPlayers.
- Start race action is disabled or clearly marked as coming soon.
- Back to dashboard works.
- All new UI text is stored in bilingual constants.
- No SSE.
- No PixiJS.
- No live race screen.
- No student join implementation.

---

## Issue 13 — QuestionTemplate model for multiple-choice future

Owner: TBD  
Status: TODO  
Branch: `feature/issue-13-question-template-model`

### Goal

Prepare correct model for future question generator.

Do not implement a temporary question generator in this issue.

### Expected files

- `server/model/QuestionTemplate.java`
- `server/enums/QuestionType.java`
- `server/enums/Difficulty.java`
- `server/repository/QuestionTemplateRepository.java`

If the project uses `entitys` instead of `model`, follow the existing project convention.

### Suggested fields

- `id`
- `subject`
- `type`
- `difficulty`
- `minValue`
- `maxValue`
- `timeLimitSeconds`
- `choicesCount`
- `active`
- `createdAt`
- `updatedAt`

### Enum plan

`QuestionType`:

- `ADDITION`
- `SUBTRACTION`
- `MULTIPLICATION`
- `DIVISION`
- `TEXT`
- `CUSTOM`

`Difficulty`:

- `EASY`
- `MEDIUM`
- `HARD`

### Definition of Done

- QuestionTemplate entity exists.
- QuestionTemplate connects to Subject.
- Supports difficulty.
- Supports question type.
- Supports value range.
- Supports time limit.
- Supports choices count.
- Supports active/inactive templates.
- Repository exists.
- Seed data can be added if useful.
- No Math hardcoding.
- No temporary generator.
- No student question screen.
- No scoring logic.

---

## Issue 14 — Stage A integration and manual testing

Owner: SHIMON & DIANA  
Status: TODO  
Branch: `feature/issue-14-stage-a-integration-polish`

### Goal

Connect, test, and polish the whole Stage A flow.

This issue should not add new major features. It is for integration, bug fixes, documentation, and final Stage A cleanup.

### Expected files

- `server/config/CorsConfig.java`
- `client/src/api/httpClient.js`
- `client/src/routes/AppRouter.jsx`
- `client/src/constants/routeConstants.js`
- `README.md`
- Any Stage A file that needs small integration fixes

### Full flow to verify

```text
login -> dashboard -> create race -> race appears -> open room page -> back to dashboard -> logout
```

### Backend manual tests

- `POST /api/auth/login` creates Cookie.
- `GET /api/auth/me` works after refresh.
- `POST /api/auth/logout` clears Cookie.
- `GET /api/subjects` works for teacher/admin.
- `POST /api/teacher/races` works for teacher.
- `GET /api/teacher/dashboard` returns only teacher-owned races.
- `GET /api/teacher/races/{raceId}/room` works only for the race owner.
- Protected request without login returns `401` JSON.
- Wrong role returns `403` JSON.
- Invalid create race body returns `400` validation response.
- Missing race returns `404` clean response.

### Frontend manual tests

- Login page loads.
- Teacher can log in.
- Refresh keeps teacher logged in.
- Unauthenticated user cannot enter teacher dashboard.
- Logout returns user to login.
- Teacher dashboard loads real data.
- Create race modal opens.
- Subject dropdown loads subjects.
- Create race validation works.
- Created race appears without refresh.
- Open room navigates correctly.
- Room page shows room code and race data.
- Empty/loading/error states are visible where relevant.
- RTL layout works.
- UI works at desktop width and narrower screen widths.

### Documentation updates

- Update README run instructions if needed.
- Add manual test checklist result.
- Mention required env variables.
- Mention that Stage B is not implemented yet.

### Definition of Done

- Full Stage A flow works locally.
- Cookie/CORS issues are fixed.
- Client build passes.
- Server runs locally.
- README is updated.
- Manual test checklist is completed.
- No fake production metrics remain.
- No Stage B features were accidentally implemented.
