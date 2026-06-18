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
- client/src/routes/ProtectedRoute.jsx
- client/src/routes/RoleRoute.jsx
- client/src/routes/AppRouter.jsx
- client/src/stores/authStore.js

---

## Issue 06 — Subject entity and endpoint

Owner: SHIMON  
Status: IN_PROGRESS  
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

### Owner
Shimon

### Status
TODO

### Branch
`feature/issue-06a-server-security-foundation`

---

## Goal

Create a central server-side security foundation before continuing with future features.

Instead of every controller manually extracting the auth cookie and validating the token, every protected request should pass through one central security flow:

`Cookie -> JWT -> User from DB -> active user validation -> SecurityContext -> Controller`

After this issue, future controllers should be protected using annotations such as:

```java
//@PreAuthorize("hasRole('TEACHER')")
//@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
```







## Issue 07 — Race entity, RaceStatus, Repository

Owner: TBD  
Status: TODO  
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

Owner: TBD  
Status: TODO  
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

## Issue 09 — CreateRaceModal frontend

Owner: TBD  
Status: TODO  
Branch: `feature/issue-09-create-race-modal`

### Goal

Create UI for creating race from teacher dashboard.

### Expected files

- `client/src/components/teacher/CreateRaceModal.jsx`
- `client/src/api/subjectApi.js`
- `client/src/api/teacherApi.js`

### Definition of Done

- Modal opens from dashboard.
- Subjects are loaded from server.
- Teacher can enter title, maxPlayers, totalDistance.
- Create race request works.
- New race appears without manual refresh.

---

## Issue 10 — Teacher Dashboard API

Owner: TBD  
Status: TODO  
Branch: `feature/issue-10-teacher-dashboard-api`

### Goal

Create backend endpoint for teacher dashboard.

### Expected files

- `server/controller/TeacherDashboardController.java`
- `server/service/TeacherDashboardService.java`
- `server/dto/response/TeacherDashboardResponse.java`

### Definition of Done

- `GET /api/teacher/dashboard` works.
- Returns teacher name.
- Returns total/active/finished counts.
- Returns only races owned by the connected teacher.

---

## Issue 11 — TeacherDashboardPage frontend

Owner: TBD  
Status: TODO  
Branch: `feature/issue-11-teacher-dashboard-page`

### Goal

Create the teacher dashboard page.

### Expected files

- `client/src/pages/TeacherDashboardPage.jsx`
- `client/src/components/teacher/TeacherDashboardHeader.jsx`
- `client/src/components/teacher/TeacherStatsCards.jsx`
- `client/src/components/teacher/RaceList.jsx`
- `client/src/components/teacher/RaceListItem.jsx`

### Definition of Done

- Dashboard loads real data from server.
- Teacher sees race list.
- Create race button exists.
- Clicking race navigates to race room.

---

## Issue 12 — Teacher Race Room Page

Owner: TBD  
Status: TODO  
Branch: `feature/issue-12-teacher-race-room`

### Goal

Create basic teacher race room page.

### Expected files

- `client/src/pages/TeacherRaceRoomPage.jsx`
- `client/src/components/teacher/RoomCodeCard.jsx`
- `client/src/components/teacher/RaceActionsPanel.jsx`
- `server/controller/TeacherRaceController.java`

### Definition of Done

- Route works for a race ID.
- Page loads race room data from server.
- Shows title, roomCode, subject, status, current players.
- Teacher cannot access race that belongs to another teacher.

---

## Issue 13 — QuestionTemplate model for multiple-choice future

Owner: TBD  
Status: TODO  
Branch: `feature/issue-13-question-template-model`

### Goal

Prepare correct model for future question generator.

### Expected files

- `server/model/QuestionTemplate.java`
- `server/enums/QuestionType.java`
- `server/enums/Difficulty.java`
- `server/repository/QuestionTemplateRepository.java`

### Definition of Done

- QuestionTemplate can connect to Subject.
- Supports difficulty, value range, time limit, choices count.
- Does not implement poor temporary generator.
- No Math hardcoding.

---

## Issue 14 — Stage A integration and manual testing

Owner: TBD  
Status: TODO  
Branch: `feature/issue-14-stage-a-integration`

### Goal

Connect and test the whole Stage A flow.

### Expected files

- `server/config/CorsConfig.java`
- `client/src/api/apiClient.js`
- `client/src/routes/AppRoutes.jsx`
- `README.md`

### Definition of Done

- Full flow works:

```text
login -> dashboard -> create race -> room page -> logout
```

- Cookie/CORS issues fixed.
- README updated with run instructions.
- Manual test checklist completed.
