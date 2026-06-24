# Stage B Plan — Production-Ready Core Race Loop

## Status

Planned.

Stage A created the teacher-side foundation: authentication, teacher dashboard, race creation, room code, and the basic teacher race room.
Stage B turns that foundation into the first real playable race loop.

## Main Goal

Build the first production-ready race flow:

```text
Student join -> RacePlayer -> Waiting room participants -> Start race -> Generated questions -> Answer validation -> Scoring -> Race progress -> Live teacher race state
```

This stage must not create throwaway code. Every feature should be designed as a clean vertical slice and should be useful after future stages are added.

## Product Outcome

At the end of Stage B:

- A teacher can create a race and share a room code.
- A student can join the race from a phone using the room code.
- The server creates a real participant for that race.
- The teacher waiting room shows real joined participants.
- The teacher can start the race.
- The student receives real generated math questions with four answer choices.
- The student answers by selecting one choice.
- The server validates the answer and does not trust the client.
- The server updates score, streak, speed, progress and player state.
- The student receives the next question.
- The teacher sees a real race state screen with player progress.
- The race can reach a basic finished state.

## Stage B Quality Rule

From Stage B onward, avoid temporary or “basic for now” implementations.

Every feature should include, when relevant:

- Persistent model or state model.
- Request and response DTOs.
- Service-layer business logic.
- Controller/API endpoint.
- Validation and authorization checks.
- Frontend API client.
- UI loading, error, empty and disabled states.
- Reuse of existing components, constants, assets and styles before creating new ones.
- Tests for backend business logic.
- Manual QA checklist.

If a feature becomes too large, split it into smaller production-ready issues instead of creating a weak placeholder.

## Core Domain Decisions

### RacePlayer is the participant entity

Use one consistent term for the participant inside a race: `RacePlayer`.

Do not mix `Student`, `Driver`, and `RacePlayer` for the same concept.
A `RacePlayer` represents a player inside one specific race. It belongs to a race, not directly to a teacher.

Recommended relationship:

```text
Teacher/User -> Race -> RacePlayer
```

A future registered student profile can be added later if needed, but Stage B should not require permanent student accounts.

### Vehicle choice is server-owned

The frontend may display vehicle options, but the selected or assigned vehicle must be stored by the server.
The server should store stable keys, not image paths.

Recommended fields/concepts:

```text
carTypeKey
carColorKey
laneNumber
```

If manual vehicle selection is not implemented in Stage B, the server should assign available car keys automatically. This keeps the database ready for future manual selection without refactoring.

### Questions are generated on demand, not pre-generated for the full race

Do not generate all race questions in advance.
Generate the next question per player according to the current player state, question template, difficulty, and balancing rules.

This supports future adaptive difficulty and “help for players behind” without redesigning the question system.

### Questions must be persisted before being sent

When the server generates a question, it must persist the actual generated question and choices before returning them to the client.

Recommended flow:

```text
Generate question
Save generated question and choices
Put active question in server cache as an optimization
Return safe question DTO to student
```

The cache is an optimization layer, not the only source of truth.

### The client never receives the correct answer

The student client receives only:

```text
questionId
questionText
choices without correctness
expiresAt or timeLimitSeconds
```

The server validates the selected choice.

### Math is the first supported subject, but architecture stays generic

Stage B implements math questions first.
However, central code should stay based on existing subject and template concepts.

Avoid central names that lock the system to math only. Math-specific logic may exist behind the generic question generation flow.

### Adaptive difficulty is planned from the start

Stage B should prepare for adaptive difficulty.
The exact algorithm can start simple, but the model should not block future behavior.

Recommended rule direction:

```text
Correct answers and streaks can increase difficulty.
Wrong answers or timeouts can lower or keep difficulty.
Harder questions can reward more score/progress/speed.
Players who fall behind can receive easier questions or assistance later.
```

### Race movement is server-authoritative but visually interpolated

The server owns the real race state: position, speed, score, streak, status and finish detection.
The frontend animates between server snapshots for smooth visuals.

Do not store every animation frame in the database.
Store important state changes and final results.

### Live updates use race-state snapshots

Stage B should expose a real race state that the teacher screen can render.
SSE is the preferred first live-update option because the teacher screen mostly consumes server events.
WebSocket can be considered later if real bidirectional real-time needs appear.

## Visual Race Screen Decision

Stage B should include an early visual race screen connected to real server state.
This screen does not need final PixiJS-level polish, but it must not be a throwaway mock.

The visual layer should:

- Render real race state snapshots.
- Use existing UI/assets/constants before creating new ones.
- Keep game logic out of the renderer.
- Animate cars smoothly between server updates.
- Be replaceable or extendable later without changing backend game rules.

## Out of Scope for Stage B

Do not implement yet:

- Final PixiJS renderer if it slows the core loop.
- Turbo/power-ups.
- Oil spill.
- Junction/highway/dirt-road advanced logic.
- Luck events.
- Advanced final statistics dashboard.
- Production deployment.
- Permanent student accounts.

These features should be built after the core loop is stable.

## Stage B Definition of Done

Stage B is complete only when:

- Student can join by room code from a mobile-first page.
- RacePlayer is created and connected to a Race.
- Vehicle keys/lane are assigned or selected and stored by the server.
- Teacher waiting room shows real participants.
- Teacher can start race with validation and ownership checks.
- Student receives generated math questions with exactly four choices.
- Generated questions and choices are persisted before being sent.
- Student answer submission validates selected choice on the server.
- Server updates score, streak, speed and progress.
- Race state can detect a basic finish condition.
- Student race page is production-ready, responsive and RTL-safe.
- Teacher race live page renders real race state.
- Backend business logic has tests where relevant.
- No duplicate frontend logic/components/constants are introduced unnecessarily.
- No placeholder implementation is left as a required part of the flow.
