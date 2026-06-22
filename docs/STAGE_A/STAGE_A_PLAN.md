# Stage A Plan — Teacher Auth, Dashboard, JWT Cookie, Create Race

## Goal

Stage A creates the first real working flow of the project:

```text
Teacher login -> Teacher dashboard -> Create race -> Room code -> Basic race room page
```

This stage must create a stable base before the full game engine, student screen, SSE, PixiJS, and advanced question generator are added.

## Why Stage A Starts Here

The project specification says the teacher creates a race room, gets a code, and projects a dashboard. Students later join by room code. Therefore the first useful product slice is the teacher flow.

Starting with teacher login and race creation lets the team build the most important infrastructure:

- Authentication
- Roles
- Protected routes
- Teacher ownership of races
- Subjects
- Race model
- Room code generation
- API flow between React and Spring Boot

## Stage A Scope

Included:

- Teacher login with username and password.
- JWT creation on the server.
- JWT stored in an HttpOnly Cookie.
- `/api/auth/me` endpoint for refresh/session restore.
- Logout that clears Cookie.
- Teacher dashboard.
- List teacher races.
- Create new race.
- Generate unique room code.
- Basic teacher race room page.
- Subject infrastructure.
- QuestionTemplate infrastructure for future multiple-choice generation.

Not included yet:

- Full question generator algorithm.
- Student race screen.
- Active SSE dashboard.
- PixiJS or advanced visual race rendering.
- Turbo, luck events, oil spill, junctions.
- Final leaderboard and race statistics.

## User Flow

1. Teacher goes to `/login`.
2. Teacher enters username and password.
3. Client sends `POST /api/auth/login`.
4. Server validates credentials.
5. Server creates JWT and writes it to a Cookie.
6. Client navigates to `/teacher/dashboard`.
7. Dashboard calls `GET /api/teacher/dashboard`.
8. Cookie is sent automatically by the browser.
9. Server identifies teacher from JWT.
10. Server returns dashboard data.
11. Teacher clicks "Create Race".
12. Client sends `POST /api/teacher/races`.
13. Server creates Race, generates roomCode, saves to DB.
14. Race appears in dashboard list.
15. Teacher enters race room page.
16. Teacher sees room code, race status, subject, and current player count.

## Main Design Decisions

### Server is the source of truth

The client must not calculate game state. This prevents cheating, duplicated logic, and inconsistent state between teacher screen and student screens.

### No hardcoding to Math

Math is only the first subject. Use `Subject` and `QuestionTemplate` so that later the team can add English, Hebrew, Science, or any other subject.

### Multiple-choice questions

The target users are elementary school students on mobile phones. Free-text answers open the mobile keyboard, cover the game screen, and slow down the race. Multiple-choice answers are better for mobile UX and game pace.

### JWT inside Cookie

The team already knows JWT and wants to use it from the start. Storing JWT in Cookie means the frontend does not manage tokens in `localStorage`. Backend reads the Cookie on protected requests.

### No poor placeholder question generator

The team should not build a temporary generator that will be thrown away. Stage A should define the model correctly, then the real generator can be built in a dedicated stage.

## Backend Entities for Stage A

### User

Fields:

- id
- username
- passwordHash
- displayName
- role
- active
- createdAt
- updatedAt

### Subject

Fields:

- id
- name
- code
- active

Example:

```text
name = חשבון
code = MATH
```

### Race

Fields:

- id
- roomCode
- teacher
- subject
- title
- status
- maxPlayers
- totalDistance
- createdAt
- startedAt
- finishedAt

### QuestionTemplate

Fields:

- id
- subject
- type
- difficulty
- minValue
- maxValue
- timeLimitSeconds
- choicesCount
- active

## Backend Services for Stage A

- `AuthService`
- `JwtService`
- `CurrentUserService`
- `SubjectService`
- `TeacherDashboardService`
- `RaceService`
- `RoomCodeService`

## Backend Controllers for Stage A

- `AuthController`
- `SubjectController`
- `TeacherDashboardController`
- `TeacherRaceController`

## Frontend Pages for Stage A

- `LoginPage.jsx`
- `TeacherDashboardPage.jsx`
- `TeacherRaceRoomPage.jsx`

## Frontend Stores for Stage A

- `useAuthStore.js`
- `useTeacherDashboardStore.js`

The auth store keeps user data and authentication state. It does not store JWT because JWT is stored in Cookie.

## Definition of Done

Stage A is complete only when:

- Teacher can log in.
- JWT Cookie is created.
- Cookie is sent automatically with protected requests.
- `/api/auth/me` restores session after refresh.
- Logout clears Cookie.
- Protected teacher routes block unauthenticated users.
- Teacher dashboard loads from server.
- Teacher sees only their races.
- Teacher can create a race.
- Server generates roomCode.
- Race is saved to DB.
- Teacher race room page shows real race data.
- Subject model exists.
- QuestionTemplate model exists.
- No central classes are hardcoded to Math.
