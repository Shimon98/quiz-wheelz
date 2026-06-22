# Architecture — Quiz Wheelz

## Main Rule

The server is the source of truth. The client displays state; it does not calculate game rules.

## System Parts

```text
React Client
  -> sends REST requests
  -> receives JSON
  -> later listens to SSE
  -> displays teacher/student UI

Spring Boot Server
  -> authenticates users
  -> manages races
  -> generates questions
  -> checks answers
  -> calculates score and progress
  -> sends real-time updates later with SSE

Database
  -> stores users, subjects, races, question templates, race state, answers, results
```

## Backend Layering

```text
Controller -> Service -> Repository -> Database
```

### Controller

- Receives HTTP request.
- Validates request structure.
- Calls service.
- Returns DTO response.
- Must not contain business logic.

### Service

- Contains business logic.
- Creates races.
- Checks permissions.
- Generates room codes.
- Calculates future game state.

### Repository

- Database access only.
- No business logic.

### DTO

- Request and response objects.
- Never return entity directly if it contains internal/private fields.

## Recommended Backend Structure

```text
server/
  config/
    CorsConfig.java
    SecurityConfig.java
    DataInitializer.java

  controller/
    AuthController.java
    SubjectController.java
    TeacherDashboardController.java
    TeacherRaceController.java

  dto/
    request/
      LoginRequest.java
      CreateRaceRequest.java
    response/
      LoginResponse.java
      CurrentUserResponse.java
      SubjectResponse.java
      RaceSummaryResponse.java
      TeacherDashboardResponse.java
      TeacherRaceRoomResponse.java
      ApiErrorResponse.java

  enums/
    UserRole.java
    RaceStatus.java
    QuestionType.java
    Difficulty.java
    RacePlayerStatus.java

  exception/
    ApiException.java
    NotFoundException.java
    UnauthorizedException.java
    ValidationException.java

  model/
    User.java
    Subject.java
    Race.java
    QuestionTemplate.java
    RacePlayer.java

  repository/
    UserRepository.java
    SubjectRepository.java
    RaceRepository.java
    QuestionTemplateRepository.java
    RacePlayerRepository.java

  security/
    JwtAuthenticationFilter.java

  service/
    AuthService.java
    JwtService.java
    CurrentUserService.java
    SubjectService.java
    TeacherDashboardService.java
    RaceService.java
    RoomCodeService.java

  utils/
    CookieUtils.java
```

## Recommended Frontend Structure

```text
client/src/
  api/
    apiClient.js
    authApi.js
    subjectApi.js
    teacherApi.js
    raceApi.js

  stores/
    useAuthStore.js
    useTeacherDashboardStore.js

  pages/
    LoginPage.jsx
    TeacherDashboardPage.jsx
    TeacherRaceRoomPage.jsx

  components/
    ui/
      Input.jsx
      Card.jsx
      Loading.jsx
      ErrorMessage.jsx
    layout/
      AppLayout.jsx
      Navbar.jsx
      ProtectedRoute.jsx
    auth/
      LoginForm.jsx
    teacher/
      TeacherDashboardHeader.jsx
      TeacherStatsCards.jsx
      RaceList.jsx
      RaceListItem.jsx
      CreateRaceModal.jsx
      RoomCodeCard.jsx
      RaceActionsPanel.jsx

  routes/
    AppRoutes.jsx

  utils/
    constants.js
    formatDate.js
```

## JWT Cookie Flow

```text
Login request
  -> AuthController
  -> AuthService validates credentials
  -> JwtService creates JWT
  -> CookieUtils writes Cookie to response
  -> Browser stores Cookie

Protected request
  -> Browser sends Cookie automatically
  -> JwtAuthenticationFilter reads Cookie
  -> JwtService validates JWT
  -> Current user is attached to request/security context
  -> Controller runs
```

## Store Flow in React

The store should not keep JWT. It keeps only UI state and user info.

```text
useAuthStore
  user
  isAuthenticated
  isLoading
  error
  loginTeacher()
  checkAuth()
  logoutUser()
```

## Future Modules

After Stage A:

- Student join flow
- Real question generator
- Student question screen
- Answer submission and scoring
- Race engine
- SSE dashboard updates
- PixiJS rendering
- Results and statistics
