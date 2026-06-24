# Issue 15 — Stage B Planning and Documentation

Owner: TBD  
Status: DONE  
Branch: `feature/issue-15-stage-b-planning`

## Goal

Update the project planning documents so Stage B becomes the official next phase: a production-ready core race loop.

## Why This Issue Exists

The current project docs were written for Stage A. Stage B introduces real gameplay, student flow, generated questions, answer validation, scoring, race progress and live state. The team needs clear planning before writing code so the domain model does not require repeated refactors.

## Scope

- Add/update Stage B planning documents.
- Add issue breakdown for Stage B.
- Add architecture decisions for RacePlayer, questions, caching, student session, race state and visual rendering.
- Add testing/QA expectations.
- Update AI workflow prompt.

## Out of Scope

- No backend implementation.
- No frontend implementation.
- No entity/controller/service code.

## Reuse-First Checklist

Before editing docs, inspect existing docs and keep useful content instead of rewriting everything.
Reuse the existing documentation style where possible.

## Planning Notes

The docs should explain:

- Stage B is not a temporary/basic phase.
- Features must be implemented as production-ready slices.
- `RacePlayer` is the single main participant concept.
- Questions are generated on demand and persisted before being sent.
- Cache is an optimization layer, not the only source of truth.
- The client never receives the correct answer.
- Frontend visuals render server state and do not own game logic.
- Existing components/constants/styles must be reused before creating new ones.

## Definition of Done

- Stage B plan exists.
- Stage B issues are listed.
- Architecture decisions are documented.
- Testing/QA plan exists.
- AI work prompt is updated.
- Existing Stage A docs remain useful as history.

## Demo Flow

Reviewer can open the docs and understand exactly what Stage B includes, what it excludes, and how to start Issue 16.


---

# Issue 16 — RacePlayer Domain

Owner: TBD  
Status: IN_PROGRESS  
Branch: `feature/issue-16-race-player-domain`

## Goal

Create the domain foundation for a participant inside a race.

## Why This Issue Exists

The project needs one consistent participant concept before student join, questions, scoring and live race state can work. The chosen concept is `RacePlayer`: a player inside one specific race.

## Scope

- Add the persistent model for a race participant.
- Connect participant to a race.
- Add status/state fields needed for waiting, racing, finished and disconnected states.
- Prepare fields for lane and vehicle assignment.
- Add repository/query support needed by later issues.
- Add tests for basic persistence/query behavior where relevant.

## Out of Scope

- No student join endpoint yet.
- No frontend join page yet.
- No question system yet.
- No scoring/race engine yet.

## Reuse-First Checklist

Inspect existing entity, enum, repository, DTO and timestamp conventions before creating new files.
Follow the current package and naming style.

## Backend Planning Notes

Recommended concepts:

- Race relationship.
- Display name.
- Lane number.
- Vehicle type/color keys.
- Status.
- Position/progress.
- Speed or speed multiplier.
- Score.
- Streak.
- Correct/wrong answer counts.
- Current difficulty.
- Join/start/finish timestamps.
- Last seen timestamp.

Do not add a direct teacher foreign key unless a clear requirement appears. Ownership should be resolved through Race -> Teacher.

## Validation and Security

- RacePlayer must always belong to one race.
- Lane/vehicle assignment should be ready for uniqueness rules per race.
- Status should use enum-like controlled values, not free text.

## Testing and QA

- Save RacePlayer connected to Race.
- Query players by Race.
- Order players by lane/join order if needed.
- Verify defaults are correct.

## Definition of Done

- RacePlayer domain exists.
- RacePlayer belongs to Race.
- It can represent waiting/racing/finished/disconnected states.
- It can support vehicle/lane assignment.
- It can support later score/progress/streak updates without refactor.

## Demo Flow

Developer can create a RacePlayer for an existing Race in tests or dev DB and query it back by race.


---

# Issue 17 — Student Join API and Session

Owner: TBD  
Status: TODO  
Branch: `feature/issue-17-student-join-api`

## Goal

Allow a student to join a waiting race using a room code and create a race-specific session.

## Why This Issue Exists

Students are not permanent users in Stage B. They need a clean way to join one race and make future requests as the correct RacePlayer.

## Scope

- Add join-by-room-code API.
- Validate race existence and status.
- Validate max player limit.
- Create RacePlayer.
- Assign lane and vehicle keys automatically unless manual selection is implemented.
- Create/return a student race session.
- Return safe join response to the frontend.

## Out of Scope

- No full student UI in this issue.
- No question delivery yet.
- No scoring yet.
- No permanent student accounts.

## Reuse-First Checklist

Inspect existing API response format, exception handling, validation annotations, auth/cookie utilities, API path constants and service conventions.
Do not create a separate response style.

## Backend Planning Notes

Recommended request data:

- room code
- display name
- optional selected vehicle key if vehicle selection is approved

Recommended response data:

- race identifier
- race title/status
- room code
- race player identifier or safe session result
- display name
- lane and vehicle keys
- max/current players

Session recommendation:

- Use a race-specific student session token/cookie separate from teacher auth.
- Include enough information to resolve raceId and racePlayerId safely.

## Validation and Security

- Room code must exist.
- Race must be waiting for players.
- Race must not exceed max players.
- Display name must be valid and child-friendly.
- Student must not be allowed to join as another RacePlayer.
- Student session must be scoped to one race/player.

## Testing and QA

- Join valid waiting race.
- Reject missing room code.
- Reject started/finished race.
- Reject full race.
- Validate duplicate names policy if defined.
- Verify session/cookie is created.

## Definition of Done

- Student can join via API.
- RacePlayer is created.
- Lane/vehicle keys are assigned or accepted safely.
- Student session is created.
- Response contains only safe data.
- Later student requests can be tied to the joined RacePlayer.

## Demo Flow

Using API client/Postman/browser call: create a race, call join with room code, verify RacePlayer exists and session is returned/set.


---

# Issue 18 — Student Join Page

Owner: TBD  
Status: TODO  
Branch: `feature/issue-18-student-join-page`

## Goal

Build a production-ready mobile-first page where a student joins a race by room code and display name.

Before creating new UI, inspect the current frontend foundation branch/work,
especially shared UI components, feature styles, content constants, hooks,
layouts, and existing dashboard patterns.
Reuse first. Extend second. Create new only when needed.

## Why This Issue Exists

The student experience starts on a phone. This page must be clean, responsive, friendly for children, and connected to the real join API from the start.

## Scope

- Add student join route/page.
- Add form for room code and display name.
- Support room code from URL if planned.
- Connect to student join API.
- Handle loading/error/success/disabled states.
- Navigate to the next student race/waiting screen after successful join.
- Reuse existing design constants, assets, logo, background patterns and UI components where possible.

## Out of Scope

- No question screen yet.
- No race animation yet.
- No manual vehicle selection unless approved as part of this issue.

## Reuse-First Checklist

Before creating components, inspect:

- Existing login page layout.
- Existing buttons/inputs.
- Existing background assets.
- Existing logo usage.
- Existing text style constants.
- Existing API client pattern.
- Existing error/loading components.

Do not duplicate Tailwind style strings if constants/components already exist.

## Frontend Planning Notes

The page should be:

- Mobile-first.
- Full-screen on phone.
- RTL-friendly.
- Touch-friendly.
- Clear and playful, but not messy.
- Usable on small screens.

Recommended UI states:

- Initial form.
- Loading while joining.
- Error for invalid room code.
- Error for race full.
- Error for race already started.
- Disabled submit while request is running.

## Testing and QA

Manual checks:

- Works on narrow phone viewport.
- No horizontal scrolling.
- Keyboard does not break layout.
- Errors are readable.
- Duplicate clicks are prevented.
- Successful join navigates correctly.

## Definition of Done

- Student can join from real UI.
- UI uses real API.
- UI handles real backend errors.
- Design is production-ready enough to keep and improve, not throw away.
- Existing components/constants/assets are reused where possible.

## Demo Flow

Open student join page on phone-sized viewport, enter room code and name, join race, verify next screen/state appears.


---

# Issue 19 — Teacher Waiting Room Real Participants

Owner: TBD  
Status: TODO  
Branch: `feature/issue-19-waiting-room-real-participants`

## Goal

Update the teacher race room/waiting room to show real joined RacePlayers instead of empty placeholder data.


Before creating new UI, inspect the current frontend foundation branch/work,
especially shared UI components, feature styles, content constants, hooks,
layouts, and existing dashboard patterns.
Reuse first. Extend second. Create new only when needed.

## Why This Issue Exists

After students join, the teacher needs immediate confidence that participants are connected and ready. This also prepares the start-race flow.

## Scope

- Update teacher race room response/state to include real participants.
- Show participant cards/slots in the waiting room.
- Show current players vs max players.
- Show player lane and vehicle indicator if available.
- Update start button enable/disable logic according to real participants.
- Reuse existing waiting room components and constants before creating new ones.

## Out of Scope

- No final live race track yet.
- No scoring yet.
- No question system yet.
- No SSE required unless already available from earlier work; refresh/polling can be temporary only if documented and replaced by Issue 27.

## Reuse-First Checklist

Inspect existing teacher race room components, dashboard styles, card components, buttons, text constants and API client functions.
Do not rewrite the whole page if existing structure can be extended.

## Backend Planning Notes

The teacher room data should include safe participant information:

- player id or safe identifier
- display name
- lane
- vehicle keys
- status
- joined time if useful

Teacher ownership must still be enforced through Race -> Teacher.

## Frontend Planning Notes

The UI should clearly show:

- Empty waiting state.
- Filled participant slots.
- Max player count.
- Start button disabled with reason if no players.
- Loading/error states.

## Testing and QA

- Teacher sees no players before join.
- Student joins.
- Teacher room shows the player after refresh/update.
- Max player count is correct.
- Teacher cannot see another teacher’s race players.

## Definition of Done

- Waiting room displays real participants.
- Start button state is based on server data.
- No duplicate UI code is introduced.
- Ownership rules remain enforced.

## Demo Flow

Teacher opens race room, student joins from join API/page, teacher sees the student in the waiting room.


---

# Issue 20 — Start Race Flow

Owner: TBD  
Status: TODO  
Branch: `feature/issue-20-start-race-flow`

## Goal

Allow the teacher to start a waiting race and transition all relevant state into the race phase.


Before creating new UI, inspect the current frontend foundation branch/work,
especially shared UI components, feature styles, content constants, hooks,
layouts, and existing dashboard patterns.
Reuse first. Extend second. Create new only when needed.

## Why This Issue Exists

The race must have a clean lifecycle before questions, scoring and live visuals can work.

## Scope

- Add start-race API/action.
- Validate teacher ownership.
- Validate race status.
- Validate at least one participant joined.
- Update race status and start timestamp.
- Update participant statuses.
- Update frontend start button to call real API.
- Navigate or transition to live race page/state.

## Out of Scope

- No question delivery yet unless connected later.
- No final race animation yet.
- No advanced countdown unless specifically approved.

## Reuse-First Checklist

Inspect existing teacher race API, route constants, service conventions, status enums, buttons and waiting room action panels.
Do not create parallel API patterns.

## Backend Planning Notes

Race lifecycle should be controlled by the server.
The frontend asks to start; the server decides whether it is allowed.

Recommended start validation:

- Current user is the race teacher.
- Race is waiting for players.
- There is at least one RacePlayer.
- Race is not finished/cancelled.

## Frontend Planning Notes

- Start button should be disabled if server state says it is not allowed.
- Show loading while starting.
- Show friendly error if start fails.
- After success, transition to live race screen or live state.

## Testing and QA

- Start with zero players is rejected.
- Start with one or more players works.
- Start another teacher’s race is rejected.
- Starting already started race is rejected.
- UI handles success/error.

## Definition of Done

- Teacher can start race from UI.
- Race status changes correctly.
- RacePlayers move to racing state.
- Start rules are enforced by backend.
- UI is connected and handles states.

## Demo Flow

Teacher creates race, student joins, teacher clicks start, race status becomes in progress and UI transitions to live race state.


---

# Issue 21 — Question Generation System

Owner: TBD  
Status: TODO  
Branch: `feature/issue-21-question-generation-system`

## Goal

Build the production-ready math question generation core based on existing templates.

## Why This Issue Exists

The game depends on generated multiple-choice questions. The generator must be reliable, testable, and connected to difficulty/template rules. It must not be a temporary random string generator.

## Scope

- Select active templates for math questions.
- Generate question text and correct answer according to template rules.
- Generate exactly four answer choices.
- Ensure one correct answer and valid distractors.
- Support difficulty concepts.
- Prepare for adaptive selection.
- Add service tests.

## Out of Scope

- No student delivery endpoint yet unless handled by Issue 22.
- No answer submission endpoint yet.
- No frontend question UI yet.
- No full advanced adaptive algorithm yet.

## Reuse-First Checklist

Inspect existing Subject, QuestionTemplate, QuestionType, Difficulty and repository conventions.
Do not create a separate hardcoded math-only domain that bypasses existing templates.

## Backend Planning Notes

The generator should be designed around:

- Subject/template.
- Question type.
- Difficulty.
- Value ranges.
- Time limit.
- Choices count.

The first supported subject is math. However, central architecture should remain generic enough for future subjects.

The generator should return an internal result that includes the correct answer, but API responses must not expose correctness to the client.

## Testing and QA

Automated tests should verify:

- Generated question follows min/max rules.
- Four choices are generated.
- One choice is correct.
- Choices are unique.
- Difficulty is used.
- Division/subtraction edge cases are handled according to chosen rules.

## Definition of Done

- Question generation is deterministic enough to test.
- Four-choice output is reliable.
- No correct answer leakage to frontend DTOs.
- Generator is not tied to UI.
- Generator is ready to be used by PlayerQuestion delivery.

## Demo Flow

Run tests or dev endpoint/service call that generates a valid math question from seeded templates.


---

# Issue 22 — Player Question Persistence and Delivery

Owner: TBD  
Status: TODO  
Branch: `feature/issue-22-player-question-delivery`

## Goal

Persist generated questions and deliver the current/next safe question to the student.

## Why This Issue Exists

A generated question must be remembered by the server so answers can be validated safely. The frontend must never receive the correct answer.

## Scope

- Persist generated question for a specific RacePlayer.
- Persist the choices for that question.
- Mark active/answered/expired status as needed.
- Return a safe question response to the student.
- Use server cache for active question only as optimization.
- Add tests for persistence and safe response mapping.

## Out of Scope

- No answer submission yet.
- No scoring yet.
- No frontend question screen yet.

## Reuse-First Checklist

Inspect existing DTO patterns, response wrappers, repository conventions, API paths and session/current-user patterns.
Do not create a new API response format.

## Backend Planning Notes

Recommended flow:

```text
Resolve student session
Find RacePlayer and Race
Validate race is in progress
Find or generate current question
Persist generated question and choices
Cache active question
Return safe response
```

Response must include:

- question identifier
- question text
- choices without correctness
- time limit or expiration
- player/race state if useful

## Validation and Security

- Student can only receive questions for their own RacePlayer.
- Race must be in a valid state.
- Correct answer must not be exposed.
- Cache miss must fall back to DB.

## Testing and QA

- Student gets question after race start.
- Correct choice flag is not in response.
- Question is saved before response.
- Cache miss still works from DB.
- Student cannot get another player’s question.

## Definition of Done

- Safe question endpoint works.
- Generated question and choices are persisted.
- Active question can be loaded from cache or DB.
- No correct answer leakage.

## Demo Flow

Start race, call current/next question endpoint as joined student, verify response has four choices and DB contains the generated question.


---

# Issue 23 — Answer Validation and Submission

Owner: TBD  
Status: TODO  
Branch: `feature/issue-23-answer-validation-submission`

## Goal

Allow a student to submit a selected choice and let the server validate the answer safely.

## Why This Issue Exists

The server must decide correctness, not the frontend. This issue creates the trusted answer validation path that scoring and race progress will use.

## Scope

- Add answer submission API.
- Resolve student session.
- Load active question.
- Validate selected choice belongs to that question.
- Validate question status/time.
- Save answer result.
- Return answer result without exposing unnecessary internal data.
- Prepare data needed by scoring/race engine.

## Out of Scope

- No full scoring engine unless included in Issue 24.
- No frontend question screen unless included later.
- No advanced anti-cheat beyond basic ownership/time validation.

## Reuse-First Checklist

Inspect existing validation/error response patterns, API paths, DTO style, service conventions and tests.
Do not put validation logic inside the controller.

## Backend Planning Notes

Recommended validation rules:

- Question belongs to the current RacePlayer.
- Question is active/unanswered.
- Selected choice belongs to the question.
- Question is not expired unless timeout behavior is being handled.
- Double answer is rejected.

The answer record should keep enough data for scoring and future statistics:

- correctness
- response time
- selected choice
- score/progress deltas later if useful
- timestamp

## Testing and QA

- Correct answer returns correct result.
- Wrong answer returns wrong result.
- Double submit is rejected.
- Choice from another question is rejected.
- Expired answer follows chosen policy.
- Student cannot answer another player’s question.

## Definition of Done

- Student can submit selected choice.
- Server validates ownership and correctness.
- Answer is persisted.
- Result is returned safely.
- Logic is covered by tests.

## Demo Flow

Student receives question, submits one of the four choices, server returns correct/wrong and answer is saved.


---

# Issue 24 — Scoring and Race Engine

Owner: TBD  
Status: TODO  
Branch: `feature/issue-24-scoring-race-engine`

## Goal

Update score, streak, speed/progress and race/player state after answers.

## Why This Issue Exists

A race is not just question validation. The game needs a consistent server-owned rule engine that moves players forward and detects finish state.

## Scope

- Add scoring rules.
- Add progress/speed update rules.
- Update RacePlayer after answer.
- Update difficulty/streak counters.
- Detect player finish.
- Detect basic race finish state.
- Add tests for scoring and race state transitions.

## Out of Scope

- No advanced power-ups/turbo/luck events.
- No final visual polish.
- No complex balancing algorithm unless approved.

## Reuse-First Checklist

Inspect existing Race/RaceStatus conventions, DTOs, service structure, exception style and test utilities.
Do not let frontend calculate score/progress/winner.

## Backend Planning Notes

Recommended rule direction:

- Everyone can have a base movement/speed concept.
- Correct answer increases score and progress/speed.
- Harder questions can reward more.
- Fast answer can reward more if timing is enabled.
- Wrong answer reduces/keeps progress effect and resets or lowers streak.
- Player status becomes finished when reaching total distance.
- Race status becomes finished according to chosen policy.

Keep the algorithm simple enough to understand, but structured so it can grow.

## Testing and QA

- Correct answer updates score/progress.
- Wrong answer does not reward incorrectly.
- Streak updates correctly.
- Difficulty reward multiplier works if enabled.
- Player finishes at total distance.
- Race finishes according to policy.

## Definition of Done

- Server owns scoring and movement decisions.
- RacePlayer updates after answers.
- Basic finish detection works.
- Tests cover important game rules.
- Frontend can consume updated state without computing game logic.

## Demo Flow

Student answers multiple questions and RacePlayer score/progress/streak changes until player reaches finish.


---

# Issue 25 — Student Race Page

Owner: TBD  
Status: TODO  
Branch: `feature/issue-25-student-race-page`

## Goal

Build the production-ready mobile student race screen for answering questions during a race.

Before creating new UI, inspect the current frontend foundation branch/work,
especially shared UI components, feature styles, content constants, hooks,
layouts, and existing dashboard patterns.
Reuse first. Extend second. Create new only when needed.

## Why This Issue Exists

The student screen is the core play experience. It must be mobile-first, fast, simple, and connected to real question/answer APIs.

## Scope

- Add student race page/route.
- Load current/next question.
- Show question and four answer choices.
- Submit selected choice.
- Show feedback.
- Show timer/progress/score/streak as available.
- Disable answer buttons after submit.
- Handle loading/error/expired states.
- Reuse existing UI constants/components/assets.

## Out of Scope

- No full teacher track renderer.
- No advanced animations if they delay the core flow.
- No free-text answers.

## Reuse-First Checklist

Inspect existing button/input/card/loading/error components, text constants, assets, API clients and hooks/stores.
Do not duplicate large Tailwind class strings. Extract constants if needed.

## Frontend Planning Notes

The screen should be:

- Full phone-screen experience.
- RTL-safe.
- Touch-friendly.
- Four large answer buttons.
- No keyboard during race.
- Clear feedback after answer.
- Resilient to slow network.

## Testing and QA

Manual QA:

- Works on small phone viewport.
- Question text remains readable.
- Four choices are large enough.
- Submit prevents double click.
- Loading and error states are clear.
- Timer/expired behavior is understandable.
- Next question loads correctly.

## Definition of Done

- Student can answer real generated questions from UI.
- UI uses real APIs.
- UI handles loading/error/disabled states.
- UI is production-ready enough to keep.
- Existing styles/components/constants are reused where possible.

## Demo Flow

Join race, start race, student page loads question, student answers, sees result, receives next question.


---

# Issue 26 — Teacher Race Live Page

Owner: TBD  
Status: TODO  
Branch: `feature/issue-26-teacher-race-live-page`

## Goal

Create the first real teacher live race screen that renders server race state visually.


Before creating new UI, inspect the current frontend foundation branch/work,
especially shared UI components, feature styles, content constants, hooks,
layouts, and existing dashboard patterns.
Reuse first. Extend second. Create new only when needed.

## Why This Issue Exists

The team needs to see the race engine visually, not only imagine it. This page should start the real visual direction without becoming a throwaway mock.

## Scope

- Add/update teacher live race page.
- Fetch real race state.
- Render players, progress, score, streak and status.
- Show a simple visual track or progress layout.
- Animate movement between server states if practical.
- Show basic leaderboard/state panel.
- Reuse existing teacher layout, cards, constants, assets and styles.

## Out of Scope

- No final PixiJS renderer unless explicitly approved.
- No turbo/luck/oil/junction visuals.
- No fake player data as the main implementation.

## Reuse-First Checklist

Inspect existing teacher dashboard/race room components, text constants, icon/assets, cards and API hooks.
Do not create a completely separate visual language.

## Frontend Planning Notes

The first visual version can use React/CSS and car images/assets.
It must render real `RaceState` data from the server.

The renderer should not decide:

- score
- progress
- speed
- winner
- finish state
- correctness

It only displays/animates state.

## Backend Planning Notes

If no race state endpoint exists yet, coordinate with the backend issue that exposes it.
The page should be able to recover by fetching latest state.

## Testing and QA

- Teacher sees all active RacePlayers.
- Progress changes after answers.
- Page handles loading/error states.
- Refresh recovers current state.
- Visual layout works on projector/desktop.

## Definition of Done

- Teacher can open live race page.
- Real players and progress render.
- No fake game logic is in the frontend.
- Visual layer is reusable and extendable.

## Demo Flow

Start race, answer from student screen, teacher live page shows updated progress/score.


---

# Issue 27 — Race SSE Stream

Owner: TBD  
Status: TODO  
Branch: `feature/issue-27-race-sse-stream`

## Goal

Provide race-specific live updates so the teacher screen can update without manual refresh.

## Why This Issue Exists

The teacher live screen should react to joins, start events, answers, progress updates and finish events. SSE is a good first fit because the teacher mostly receives server updates.

## Scope

- Convert or extend existing SSE infrastructure to race-specific subscriptions.
- Subscribe teacher/client to a specific race stream.
- Emit important race events.
- Add frontend hook/client to listen for race updates.
- Keep fallback fetch/latest-state behavior.

## Out of Scope

- No WebSocket unless a concrete need is proven.
- No per-frame movement streaming.
- No advanced reconnection strategy beyond reasonable first version.

## Reuse-First Checklist

Inspect existing SSE controller/service before creating a new parallel system.
Inspect existing frontend API/config patterns.

## Backend Planning Notes

Recommended event types:

- PLAYER_JOINED
- RACE_STARTED
- QUESTION_ANSWERED
- PLAYER_PROGRESS_UPDATED
- RACE_STATE_SNAPSHOT
- RACE_FINISHED

SSE should publish server-owned state. It should not require the frontend to calculate game rules.

## Frontend Planning Notes

The frontend should:

- Open stream for the current race.
- Update local race state from events/snapshots.
- Smoothly animate between states where possible.
- Refetch latest state on reconnect or error.

## Testing and QA

- Teacher receives player joined event.
- Teacher receives race started event.
- Teacher receives progress update after answer.
- Reconnect/refetch path works.
- Unauthorized user cannot subscribe to another teacher’s race.

## Definition of Done

- Race-specific SSE stream works.
- Teacher live screen updates after real game events.
- Fallback latest-state fetch exists.
- Existing SSE code is reused or refactored cleanly.

## Demo Flow

Teacher opens live page, student answers question, teacher page updates without manual refresh.


---

# Issue 28 — Stage B Integration and QA

Owner: TBD  
Status: TODO  
Branch: `feature/issue-28-stage-b-integration-qa`

## Goal

Connect, test and stabilize the full Stage B race loop.

## Why This Issue Exists

After separate production-ready slices are merged, the full flow must be tested as one product experience.

## Scope

- End-to-end manual QA of Stage B.
- Fix integration bugs.
- Clean duplicate code discovered during integration.
- Update README/run docs if needed.
- Confirm Stage B Definition of Done.
- Prepare notes for Stage C.

## Out of Scope

- No major new feature unless it blocks Stage B DoD.
- No PixiJS/turbo/luck/junction implementation.

## Reuse-First Checklist

Before fixing bugs by creating new utilities/components, check whether the fix belongs in existing shared code.
Do not patch the same behavior in multiple places.

## Integration Flow

```text
Teacher logs in
Teacher creates race
Teacher opens waiting room
Student joins by room code
Teacher sees student
Teacher starts race
Student receives question
Student submits answer
Server validates answer
Score/progress/streak update
Teacher live page updates
Race reaches finish state
```

## Testing and QA

Run:

- Backend service tests.
- Frontend build/lint if available.
- Manual flow on desktop teacher screen.
- Manual flow on phone-size student screen.
- Refresh/reconnect tests.
- Error scenarios.

## Definition of Done

- Full Stage B flow works.
- All critical bugs are fixed.
- No known placeholder implementation remains in the main flow.
- Docs are updated.
- Stage C next steps are documented.

## Demo Flow

Record or manually demonstrate the full flow from teacher login to race finish.
