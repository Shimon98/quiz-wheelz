# AGENTS.md — QuizWheelz / Educational Race Project

This file defines the working rules for all AI agents, coding assistants, and developers working on QuizWheelz.

Read this file before planning or changing code.

---

## 1. Project Overview

QuizWheelz is an educational real-time race game for elementary school students and teachers.

A teacher logs in, creates a race room, receives a room code, and later projects a live classroom race dashboard. Students join from mobile phones using the room code, answer multiple-choice questions, and appear as race players/cars moving on a track.

The server is the source of truth for all game logic.

The first supported subject is Math. The architecture must still remain open for future subjects through `Subject`, `QuestionTemplate`, `QuestionType`, and `Difficulty`.

Do not build the project as a Math-only system.

---

## 2. Current Main Goal — Stage B

Stage A is considered the completed foundation:

```text
Teacher login -> Teacher dashboard -> Create race -> Room code -> Basic teacher race room page
```

The current main goal is:

```text
Stage B — Production-Ready Core Race Loop
```

Stage B builds the first real playable race loop:

```text
Teacher creates race
Student joins with room code
Server creates RacePlayer
Teacher sees real participants in the waiting room
Teacher starts race
Student receives generated Math question
Student answers with one of 4 choices
Server validates answer
Server calculates scoring, speed, progress, and streak
Race state updates
Teacher sees live/near-live race state
Race can finish with a basic winner/result state
```

Stage B must not be a throwaway prototype. Every feature must be implemented as a clean, production-ready vertical slice.

---

## 3. Production-Ready Rule

Do not create temporary, weak, throwaway, or “basic for now” implementations.

If a feature is too large, split it into smaller production-ready issues instead of building a messy placeholder.

Every feature should include the relevant parts of a complete vertical slice:

```text
Database model when needed
Repository when needed
DTOs for request and response
Service-layer business logic
Controller endpoint when needed
Validation
Authorization / ownership checks
Frontend API client
Frontend hook/store when needed
Production-quality UI states
Tests for backend logic where applicable
Manual QA checklist
```

A feature is not done if it only works in the happy path and ignores loading, error, empty, disabled, authorization, or invalid-state behavior.

---

## 4. Server Is the Source of Truth

The client must not calculate or decide:

- Question correctness
- Score
- Speed bonus
- Player progress
- Race status
- Winner
- Final results
- Game events
- Whether a player is allowed to answer
- Whether a race has ended

The client may animate and display state received from the server.

Frontend animation is allowed, but frontend game logic is not allowed.

---

## 5. Main Domain Naming Rules

Use one consistent name for the race participant:

```text
RacePlayer
```

Do not use `Student`, `Driver`, and `RacePlayer` interchangeably for the same concept.

Current meaning:

```text
RacePlayer = a participant inside one specific race
```

A future registered student account may become a separate concept, such as `StudentProfile` or `StudentUser`, but Stage B should not mix that into the race participant model.

Relationship direction:

```text
Teacher/User -> Race -> RacePlayer
```

`RacePlayer` should belong to a `Race`. Do not duplicate a direct teacher foreign key in `RacePlayer` unless a strong reason is documented.

---

## 6. Car / Vehicle Selection Rule

Vehicle choice is server-owned state.

The frontend may display available cars and colors, but the selected or assigned car must be stored on the server as stable keys, for example:

```text
carTypeKey
carColorKey
```

Do not store image paths as game state. Store stable identifiers and let the frontend map them to assets.

If manual car selection is not implemented yet, the server should assign an available car/color automatically. Keep the model ready for future manual selection without requiring a database refactor.

---

## 7. Student Race Session Rule

Students are not regular logged-in teacher users.

A student joining a race should receive a race-specific session/token/cookie that identifies the active `RacePlayer`.

The token/session should be tied to:

```text
raceId
racePlayerId
role/type = STUDENT_RACE
expiration
```

The frontend must not rely only on the student display name to identify the player.

Teacher authentication and student race session must remain separate concepts.

---

## 8. Question System Rule

Do not implement the question generator alone.

When the project starts the question system, it must design the full flow together:

```text
QuestionTemplate selection
Question generation
Choice generation
Persisting the generated question
Persisting choices
Delivering only safe question data to the client
Answer validation
Timing validation
Scoring
Progress update
Tests
```

The client must never receive the correct answer or a `correct=true` flag before answering.

The first supported subject is Math, but central architecture must remain generic:

```text
Subject
QuestionTemplate
QuestionType
Difficulty
```

Avoid central classes named as if the whole system is Math-only, such as:

```text
MathRace
MathQuestion
MathQuestionService
```

Math-specific behavior may exist inside focused generation logic, but the overall architecture must remain open for future subjects.

---

## 9. Generated Questions, Database, and Cache

Generated questions should be persisted before being sent to a student.

Preferred flow:

```text
Generate question
Save generated question and choices to DB
Put active question into server-side cache if needed
Return safe question DTO to student
```

When the student answers:

```text
Try to load active question from cache
If cache miss, load from DB
Validate ownership and time
Validate selected choice
Persist answer
Update RacePlayer score/progress/streak/speed
Evict answered question from active-question cache
Generate next question if needed
```

Cache is an optimization layer, not the only source of truth.

Do not store per-frame car movement in the database.

Persist important game data such as:

```text
Race
RacePlayer
Generated question / PlayerQuestion
Question choices
Answer
Important game events
Final result
```

Do not persist every animation frame or every tiny movement tick.

---

## 10. Difficulty and Adaptive Question Planning

Stage B should be designed so question difficulty can support adaptive behavior.

A race may start with fixed difficulty or adaptive difficulty, but the model and services must not block adaptive difficulty later.

Potential adaptive logic:

```text
Correct answers / streak -> slightly increase difficulty
Wrong answer / timeout -> decrease or keep difficulty
Harder questions -> more score and more speed/progress reward
Easier questions -> lower score and smaller speed/progress reward
Player far behind -> possible assistance policy in a future stage
```

Do not mix catch-up / assistance logic directly into the question generator. Prefer a separate policy/service later if needed.

---

## 11. Race Engine Rule

All cars may visually move forward, but the server decides the authoritative race state.

The server owns:

```text
position
speed
score
streak
status
finishedAt
winner/result state
```

The frontend may use interpolation to animate cars smoothly between server snapshots.

Preferred Stage B live model:

```text
REST for student join, question delivery, and answer submission
SSE for teacher race state updates and race events
Client interpolation for smooth visual movement
```

Do not introduce WebSocket unless a clear reason is documented and approved.

Do not make PixiJS or any renderer responsible for game rules. Renderers only draw the `RaceStateSnapshot` received from server/client state.

---

## 12. Frontend Production Workflow

Frontend work must follow a reuse-first workflow.

Before creating any new component, hook, style file, constant file, or API function:

1. Inspect the existing project structure.
2. Inspect shared UI components.
3. Inspect feature components.
4. Inspect existing styles/config/content/constants.
5. Inspect existing hooks and API clients.
6. Reuse first.
7. Extend second.
8. Create new only when the existing code does not match the responsibility.

Do not create duplicate components for the same UI need.

Examples of things to check before creating new UI:

```text
shared/components/ui
features/*/components
features/*/styles
features/*/content
constants
api clients
hooks
layouts
assets
```

---

## 13. Frontend Component Rules

Pages compose the screen. They should not contain heavy UI details or business logic.

Hooks manage data loading and async actions.

Components display UI from props.

Utilities handle pure calculations, formatting, view-model mapping, and repeated logic.

Content files hold text.

Style/config files hold repeated Tailwind class groups and visual constants.

Recommended separation:

```text
Page
- route params
- navigation
- auth/store connection
- calls feature hook
- composes screen sections

Hook
- API calls
- loading/error state
- async actions
- refresh/retry behavior

Component
- receives props
- renders UI
- no direct API calls unless clearly justified

Content file
- Hebrew/English labels
- validation messages
- empty/error/loading texts

Styles/config file
- repeated class names
- visual variants
- layout constants

Utils
- formatting
- view-model mapping
- pure helper logic
```

Do not put large logic inside JSX.

Do not keep repeated constants inside components.

Do not hardcode user-facing strings inside components when the feature already uses content files.

Small one-off class names are acceptable, but long repeated Tailwind class groups should be moved to a style/config file.

---

## 14. Frontend UI / UX Rules

Student screens must be mobile-first.

Student pages should work as full phone screens and adapt to the user’s device size.

Requirements for student UI:

```text
Large tap targets
Readable text
Clear visual hierarchy
RTL support
Responsive layout
No tiny buttons
No unnecessary keyboard during the race
Loading states
Error states
Empty states
Disabled states after submit
Friendly child-appropriate visuals
Reduced-motion support when animations are used
```

Teacher screens should be clear, readable, and visually balanced. Do not overcrowd cards or panels.

Any new design should match the current visual language unless the user explicitly approves a new design direction.

Use existing design assets and components where possible.

---

## 15. Frontend Constants, Content, and Styles

Do not store repeated constants in JSX components.

Use dedicated files when the value is reused or part of a feature design:

```text
content files for labels/messages/text
styles files for Tailwind class groups
config files for UI options and non-secret constants
utils files for pure helper functions
```

Examples:

```text
teacherDashboardContent.js
raceWaitingRoomStyles.js
dashboardUiStyles.js
routeConstants.js
languageDirectionUtils.js
```

Follow the existing project patterns before creating a new pattern.

---

## 16. Backend Architecture Rules

Controllers must stay thin.

Controllers should:

```text
Receive request
Validate request body/path through DTO validation where relevant
Call service
Return response DTO
```

Services contain business logic.

Repositories access the database.

DTOs are used for request and response objects.

Entities should not be exposed directly to frontend responses.

Do not put race rules, scoring, answer validation, or question generation logic inside controllers.

---

## 17. Suggested Backend Package Direction

Follow the existing project structure first.

Recommended backend areas:

```text
server/
  config/
  controller/
  dto/
    request/
    response/
  entitys/ or model/          # follow the existing project naming until a refactor is approved
  enums/
  exception/
  repository/
  security/
  service/
  utils/
```

Do not rename packages or move many files unless the task is specifically a refactor issue.

---

## 18. Suggested Frontend Structure Direction

Follow the existing project structure first.

Recommended frontend areas:

```text
client/src/
  api/
  assets/
  constants/
  features/
    auth/
    teacherDashboard/
    studentJoin/
    studentRace/
    raceLive/
  layouts/
  routes/
  shared/
    components/
      ui/
  stores/
  utils/
```

New Stage B frontend features should use feature folders and reuse shared UI components when possible.

Do not place all new Stage B UI under generic `components/` unless it is actually shared.

---

## 19. Auth and Cookie Rules

Teacher authentication uses JWT stored in an HttpOnly Cookie.

The client must not store teacher JWT in `localStorage`.

Frontend API clients must send credentials where required.

Student race session must not overwrite teacher auth.

Use separate cookie/session concepts for:

```text
teacher auth
student race session
```

---

## 20. API Design Rules

Prefer clear, role-based endpoint groups.

Teacher endpoints should remain under teacher-owned routes, for example:

```text
/api/teacher/...
```

Student race endpoints should be separate from teacher auth endpoints, for example:

```text
/api/student/...
```

The exact endpoint names should be planned per issue and checked against existing `ApiPaths` / route constants before implementation.

Do not create duplicate endpoints that do the same thing.

---

## 21. Testing Expectations

Backend logic should have automated tests when logic is added.

Prioritize tests for:

```text
Room code generation
Race ownership checks
RacePlayer join rules
Student session/token rules
Question generation
Choice generation
Answer validation
Timing validation
Scoring
Race engine progress
Race finish detection
Cache fallback behavior when applicable
```

Frontend must at minimum include manual QA steps in the issue/PR summary.

Manual frontend QA should check:

```text
Loading state
Error state
Empty state
Disabled state
Mobile viewport
Desktop viewport when relevant
RTL layout
Keyboard behavior on phone screens
Navigation flow
Refresh behavior
```

---

## 22. Git Workflow

Never work directly on `main`.

Use `develop` as the integration branch unless the user says otherwise.

Use one branch per issue.

Before starting:

```bash
git checkout develop
git pull origin develop
git status
```

Branch naming:

```text
feature/issue-15-stage-b-planning
feature/issue-16-race-player-domain
feature/issue-17-student-join-api
feature/issue-18-student-join-page
feature/issue-19-waiting-room-real-participants
feature/issue-20-start-race-api
feature/issue-21-question-generation-system
feature/issue-22-player-question-delivery
feature/issue-23-answer-validation-api
feature/issue-24-scoring-race-engine
feature/issue-25-student-race-page
feature/issue-26-teacher-race-live-page
feature/issue-27-race-sse-stream
feature/issue-28-stage-b-integration-qa
```

If Diana or another teammate has an active frontend branch, inspect it before planning frontend work and avoid duplicating or overwriting it.

---

## 23. Required Workflow for AI Agents

Before modifying files:

1. Read this `AGENTS.md`.
2. Read relevant files under `docs/`.
3. Inspect the repository structure.
4. Inspect active branches mentioned by the user when relevant.
5. Run `git status` when working locally.
6. Explain the plan clearly.
7. List expected changed files.
8. Wait for user approval unless the user explicitly asked for direct implementation.

When implementing:

1. Make the smallest useful production-ready change.
2. Do not rewrite unrelated files.
3. Do not change formatting across the whole project.
4. Do not introduce new libraries without explaining why and getting approval.
5. Do not store secrets in code.
6. Add or update tests when backend logic is added.
7. Keep naming consistent with the existing project.
8. Reuse existing frontend components, hooks, constants, content, styles, and API patterns before creating new ones.

After implementing:

1. Explain what changed.
2. Mention files changed.
3. Mention how to test manually.
4. Mention what automated tests were added or should be added.
5. Mention risks or follow-up work if anything remains.
6. Suggest the next clean step.

---

## 24. Stage B Issue Planning Rule

Each Stage B issue should include:

```text
Goal
Why this issue exists
Scope
Out of scope
Backend planning notes
Frontend planning notes when relevant
Reuse-first checklist
Validation and security notes
Testing and QA
Definition of Done
Demo flow
```

Avoid locking the issue too early to exact class names unless the file already exists or the architecture is already confirmed.

Use recommended class/component names as suggestions, not as forced requirements, unless the issue explicitly says otherwise.

---

## 25. What Not To Do Yet

Do not implement these until they are planned in their own stage or issue:

```text
Advanced PixiJS final rendering
Full polished game canvas as final production renderer
Turbo events
Oil spill
Junction / highway / dirt road logic
Luck events
Advanced catch-up balancing
Final advanced leaderboard/statistics dashboard
Admin dashboard
Production deployment
Registered student accounts
Multi-subject generator beyond Math
```

Stage B may include an early visual race screen, but it must render real race state and must not become a throwaway mock.

---

## 26. If Unsure

Stop and ask before changing files.

Do not guess architecture.

Do not silently change the plan.

Do not introduce shortcuts that create technical debt.

Do not create duplicated frontend components before checking what already exists.

Do not create backend entities that will obviously require immediate refactor.

