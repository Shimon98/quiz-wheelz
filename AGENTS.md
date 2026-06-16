# AGENTS.md — Quiz Wheelz / Educational Race Project

## Project Overview

This project is an educational real-time race game for elementary school students.

A teacher logs into the system, creates a race room, receives a room code, and later projects a live classroom dashboard. Students join the race from mobile phones using the room code and answer multiple-choice questions. The server is the source of truth for all game logic.

The project must not be hardcoded to Math only. Math is only the first subject. The system must support adding more subjects in the future through `Subject` and `QuestionTemplate`.

## Current Main Goal — Stage A

Stage A focuses only on:

- Teacher login
- JWT authentication stored in HttpOnly Cookie
- Teacher dashboard
- Creating a race
- Generating a room code
- Basic teacher race room page
- Initial infrastructure for subjects and multiple-choice question templates

Do not start PixiJS, SSE, full student screen, game engine, turbo events, road rendering, or advanced question generation before Stage A is completed.

## Core Principles

1. The server is the source of truth.
   - The client must not calculate score, race status, winner, question correctness, player progress, or game events.
   - The client displays data received from the server.

2. No hardcoding to Math.
   - Use `Subject`, `QuestionTemplate`, `QuestionType`, and `Difficulty`.
   - Do not create central classes named `MathRace` or `MathQuestion`.

3. Mobile-first student UX.
   - Students are elementary school children.
   - Student questions should be multiple-choice.
   - Avoid free-text input during the race because mobile keyboards cover the screen and harm the game experience.

4. Keep logic out of Controllers.
   - Controllers receive requests and return responses.
   - Services contain business logic.
   - Repositories access the database.
   - DTOs are used for request and response objects.

5. Work in small branches and PRs.
   - Never work directly on `main`.
   - Prefer `develop` for integration.
   - Use one branch per issue.

## Required Workflow for AI Agents

Before modifying files:

1. Read this `AGENTS.md`.
2. Read relevant files under `docs/`.
3. Inspect the repository structure.
4. Run `git status`.
5. Explain the plan clearly.
6. List the files expected to change.
7. Wait for user approval unless the user explicitly asked for direct implementation.

When implementing:

1. Make the smallest useful change.
2. Do not rewrite unrelated files.
3. Do not change formatting across the whole project.
4. Do not introduce new libraries without explaining why.
5. Do not store secrets in code.
6. Add or update tests when logic is added.
7. Keep naming consistent with the existing project.

After implementing:

1. Explain what changed.
2. Mention files changed.
3. Mention how to test manually.
4. Mention what automated tests were added or should be added.
5. Suggest the next step.

## Git Branch Naming

Use:

- `feature/issue-01-user-role-model`
- `feature/issue-02-login-page`
- `feature/issue-03-jwt-cookie-auth`
- `feature/issue-04-auth-controller`
- `feature/issue-05-protected-route`
- `feature/issue-06-subject-endpoint`
- `feature/issue-07-race-entity`
- `feature/issue-08-create-race-api`
- `feature/issue-09-create-race-modal`
- `feature/issue-10-teacher-dashboard-api`
- `feature/issue-11-teacher-dashboard-page`
- `feature/issue-12-teacher-race-room`
- `feature/issue-13-question-template-model`
- `feature/issue-14-stage-a-integration`

## Backend Architecture

Recommended package structure:

```text
server/
  config/
  controller/
  dto/
    request/
    response/
  enums/
  exception/
  model/
  repository/
  security/
  service/
  utils/
```

Important backend classes for Stage A:

```text
User
Subject
Race
QuestionTemplate

UserRole
RaceStatus
QuestionType
Difficulty

AuthController
SubjectController
TeacherDashboardController
TeacherRaceController

AuthService
JwtService
CurrentUserService
SubjectService
TeacherDashboardService
RaceService
RoomCodeService

CookieUtils
JwtAuthenticationFilter
SecurityConfig
CorsConfig
DataInitializer
```

## JWT Cookie Authentication Rules

Authentication should use JWT stored in a Cookie.

The client should not store the JWT in `localStorage`.

Backend responsibilities:

- Create JWT after successful login.
- Write JWT into Cookie using `HttpServletResponse`.
- Read JWT from Cookie using `HttpServletRequest`.
- Validate JWT in `JwtAuthenticationFilter` or equivalent `AuthFilter`.
- Set the connected user in `SecurityContext` or in the project authentication mechanism.
- Provide `/api/auth/me`.
- Clear Cookie on logout.

Frontend responsibilities:

- Use `withCredentials: true` in axios or `credentials: "include"` in fetch.
- Call `/api/auth/me` after page refresh.
- Store only user info and auth status in client store, not the JWT.

## Frontend Architecture

Recommended structure:

```text
client/src/
  api/
  stores/
  pages/
  components/
    ui/
    layout/
    auth/
    teacher/
    race/
  routes/
  utils/
```

Important frontend files for Stage A:

```text
apiClient.js
authApi.js
subjectApi.js
teacherApi.js

useAuthStore.js
useTeacherDashboardStore.js

LoginPage.jsx
TeacherDashboardPage.jsx
TeacherRaceRoomPage.jsx

LoginForm.jsx
ProtectedRoute.jsx
Navbar.jsx
CreateRaceModal.jsx
RaceList.jsx
RaceListItem.jsx
RoomCodeCard.jsx
RaceActionsPanel.jsx
```

## Store Rules

Use a client store such as Zustand or React Context.

The auth store should keep:

- `user`
- `isAuthenticated`
- `isLoading`
- `error`

It should not keep the JWT token because the token is stored in a Cookie.

Recommended auth actions:

- `loginTeacher(username, password)`
- `checkAuth()`
- `logoutUser()`

## API Endpoints for Stage A

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

GET  /api/subjects

GET  /api/teacher/dashboard
GET  /api/teacher/races
POST /api/teacher/races
GET  /api/teacher/races/{raceId}
GET  /api/teacher/races/{raceId}/room
```

## Stage A Definition of Done

Stage A is done only when:

- Teacher can log in.
- JWT Cookie is created.
- Cookie is sent automatically with protected requests.
- `/api/auth/me` works after refresh.
- Logout clears the Cookie.
- Protected teacher routes cannot be accessed without login.
- Teacher dashboard loads real data from server.
- Teacher can create a race.
- Race is saved in the database.
- Room code is generated by the server.
- Teacher sees only their own races.
- Basic teacher race room page works.
- `Subject` exists and Math is not hardcoded into central classes.
- `QuestionTemplate` exists as infrastructure for future multiple-choice generation.
- Each issue is completed in a separate branch and PR.
- Tests are added for backend logic where possible.

## Testing Expectations

For backend logic, prefer JUnit and Mockito.

Add tests for:

- `JwtService`
- `CookieUtils`
- `RoomCodeService`
- `RaceService`
- `SubjectService`
- `TeacherDashboardService`

For frontend, at minimum manually test:

- Login
- Refresh page and remain logged in
- Logout
- Protected route redirect
- Load teacher dashboard
- Create race
- Navigate to race room

## What Not To Do Yet

Do not implement yet:

- PixiJS rendering
- Full game canvas
- Full SSE dashboard
- Student full race screen
- Turbo
- Oil spill
- Junction / highway / dirt road logic
- Final leaderboard
- Full question generator algorithm

Prepare the structure for them, but do not build them before Stage A is complete.

## If Unsure

If the agent is unsure, it must stop and ask before changing files.

Do not guess architecture.
Do not silently change the plan.
Do not introduce shortcuts that create technical debt.
