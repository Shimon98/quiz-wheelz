# Stage B Architecture Decisions

This document records the main architecture decisions for Stage B so the team does not refactor the same domain model repeatedly.

## 1. Participant Naming

Use one main term for a participant in a race: `RacePlayer`.

Meaning:

```text
RacePlayer = a student/child/player participating in one specific race
```

Avoid mixing several names for the same concept in code, DTOs and UI state.
The UI may display Hebrew text like “תלמיד” or “נהג”, but the backend concept should stay consistent.

## 2. RacePlayer Ownership

A RacePlayer belongs to a Race.
A Race belongs to a Teacher/User.

Recommended relationship:

```text
Teacher/User -> Race -> RacePlayer
```

Do not add direct teacher ownership to RacePlayer unless a future requirement needs it. It creates duplicated ownership data and can become inconsistent.

## 3. RacePlayer State

RacePlayer should be able to represent individual player state even when the race has a global status.

Examples:

```text
Race status = IN_PROGRESS
Player A status = RACING
Player B status = FINISHED
Player C status = DISCONNECTED
```

Recommended concepts:

- display name
- lane number
- vehicle keys
- position/progress
- speed or speed multiplier
- score
- streak
- correct/wrong answer counts
- current difficulty
- status
- join/start/finish timestamps
- last seen timestamp

Exact field names should follow the existing project style.

## 4. Vehicle Storage

The server stores the selected or assigned vehicle using stable keys.
The frontend maps those keys to images/components.

Recommended concepts:

```text
carTypeKey
carColorKey
```

Do not store raw image URLs in the database.
Do not let the frontend be the only place that remembers the selected vehicle.

If vehicle selection is postponed, the server should assign a default or available vehicle key automatically.

## 5. Student Race Session

A student is not a permanent user in Stage B.
After join, the server should issue a race-specific student session.

Recommended session/token contents:

```text
token type = student race session
raceId
racePlayerId
displayName
expiration
```

Use a separate cookie/session name from the teacher auth cookie.

The purpose is to make later requests simple and safe:

```text
current student session -> raceId + racePlayerId -> allowed operations
```

## 6. Question Templates

QuestionTemplate is the reusable base that describes how questions may be generated.

It should be seeded into the database in a repeatable/idempotent way.
Possible approaches:

- Migration/seed script.
- Startup data initializer that does not create duplicates.
- JSON seed file loaded safely.

Do not manually depend on local database state that cannot be recreated by the team.

## 7. Generated Questions

A generated question is not the same as a template.
The actual question sent to a player should be persisted.

Reason:

- Prevent cheating.
- Validate that the submitted answer belongs to the actual question.
- Support statistics and review later.
- Support adaptive difficulty.
- Recover from cache loss.

The frontend must not receive the correct answer flag.

## 8. Cache Strategy

Caching is allowed as an optimization, but it must not be the only source of truth.

Recommended cache layers:

### Template cache

Stores active templates by subject/difficulty/type.

### Active question cache

Stores the current active question per player or by question ID for fast answer validation.
The DB remains the fallback.

### Race runtime cache

Stores live race state such as current positions, speeds, leaderboard and last update time.
The DB stores important state changes, not every animation frame.

## 9. Question Generation Timing

Generate questions on demand per RacePlayer.

Avoid generating all race questions in advance because future adaptive difficulty depends on the player’s current performance.

## 10. Adaptive Difficulty

Stage B should prepare for adaptive difficulty even if the first algorithm is simple.

Possible rule direction:

```text
correct streak -> slightly harder question
wrong answer or timeout -> easier/same difficulty
harder question -> more score/progress/speed
player far behind -> possible easier question or assistance later
```

Keep this policy in a dedicated service/logic area instead of mixing it directly into controllers or UI.

## 11. Race Engine

The race engine owns game state changes:

- progress/position
- speed changes
- score changes
- streak changes
- finish detection
- race status transitions

The frontend should not decide if a player finished or won.

## 12. Live Updates and Animation

Use server-authoritative snapshots.

The server sends:

```text
race status
server time
player positions
player speeds
scores
streaks
leaderboard
```

The frontend animates smoothly between snapshots.
This is client interpolation, not client game logic.

SSE is the preferred first live update mechanism for teacher race state.
WebSocket can be evaluated later if a real bidirectional need appears.

## 13. Frontend Reuse Rule

Before creating new frontend code, inspect existing:

- shared components
- feature components
- constants
- text style constants
- button/input styles
- assets
- layout wrappers
- loading/error components
- API client patterns
- stores/hooks patterns

Do not duplicate Tailwind strings or UI patterns when a reusable constant/component already exists.

## 14. Backend Reuse Rule

Before creating new backend code, inspect existing:

- API path constants
- response wrapper pattern
- exception handling pattern
- current user/session logic
- repositories and query naming style
- DTO package conventions
- service conventions
- validation annotations
- test style

Do not create a second pattern when the project already has one.
