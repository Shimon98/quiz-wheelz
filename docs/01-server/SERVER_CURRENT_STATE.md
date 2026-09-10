# Server Current State

**Status:** Canonical  
**Audit date:** 2026-09-10
**Code baseline:** `main@bb2d00530f4637d4d1f75849fb0397ac443bc46a`
**This document owns:** the implemented backend capabilities, gaps and stale assumptions

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Stack

- Java 21
- Spring Boot 3.5
- Spring Web, Validation, Security and JPA
- MySQL for durable state
- Redis for temporary presence/runtime
- JWT cookies
- H2 for tests
- SpringDoc/OpenAPI
- Actuator
- JUnit/Mockito
- Docker Compose development support.

The WebSocket starter and demo package still exist, but the approved teacher live
strategy is REST + SSE. WebSocket cleanup is deferred and is not part of S0-03.

## Implemented domains and flows

### Security foundation

- BCrypt password hashes.
- JWT cookie authentication.
- centralized `SecurityFilterChain`
- authentication filter and security context
- `@PreAuthorize` expressions
- current-user service
- consistent 401/403/error handling.

### Teacher flow

- login/me/logout
- subjects
- teacher dashboard
- race list/create
- unique room code
- teacher-owned room data
- real RacePlayers in waiting room
- start-race command with validation and locking.
- teacher-owned live-state GET with exact projector/recovery fields, injected-clock
  epoch-millisecond server time, server-owned `baseMovementUnitsPerSecond`, durable event
  version and every joined player in shared authoritative competition order
- live-state performs one owned Race lookup plus one RacePlayer list fetch and is
  read-only: no Redis/presence/activity, movement settlement, timeout, reconnect,
  re-anchor, persistence or event publication
- `Race.liveEventVersion` persists as non-null `live_event_version` with entity and
  database default `0`; S2-02 atomically increments it with each same-transaction
  durable event. Production migration remains Phase 6 debt.

### Durable live-event model

- `race_live_events` persists a typed JSON payload with Race, positive per-Race
  version, exact event type and injected-Clock epoch-millisecond occurrence time.
- The exact vocabulary is `PLAYER_JOINED`, `RACE_STARTED`, `QUESTION_ANSWERED`,
  `PLAYER_PROGRESS_UPDATED`, `PLAYER_FINISHED` and `RACE_FINISHED`.
- `(race_id, version)` is unique and indexed. Allocation uses one atomic database
  increment followed by the scalar committed cursor; there is no Redis or JVM event
  sequence.
- Event persistence requires the authoritative owner's existing transaction. Domain
  mutation, cursor and event row commit or roll back together; there is no
  `REQUIRES_NEW` or after-commit durable event write.
- Race start, progress and terminal payloads reuse the teacher live-state player
  mapper and shared standing calculator. Full snapshots carry all affected ranks and
  competition ties; answer events contain no choice or correct-answer material. The
  snapshots are durable authoritative positions, not a guarantee that each player
  shares the event occurrence time as a movement anchor; future teacher rendering may
  interpolate toward them but never independently advances gameplay truth.
- Join/start/answer, periodic settlement, timeout, focus, disconnect, heartbeat,
  reconnect, race-state and finalization boundaries record only visible changes.
  Before/after transition detection prevents duplicate player/race terminal events.
- Teacher-owned `GET /api/teacher/races/{raceId}/events/stream` requires an owned Race
  and a valid `afterVersion` or `Last-Event-ID` cursor. MVC binds both as raw text;
  header precedence is selected before parsing the fallback query. A malformed
  selected cursor uses the focused error without exposing foreign Race existence.
- The shared payload codec writes and reconstructs exactly the six typed payloads with
  the configured `ObjectMapper`. MySQL replay is Race-scoped, strictly ascending,
  bounded to 100 events and continued by durable version rather than page number.
- A one-second committed-event dispatcher owns transport delivery on a focused
  single-thread scheduler that is not a default candidate, isolating SSE DB/network
  work from authoritative gameplay scheduling. Per-connection
  server IDs, cursors and write locks permit simultaneous independent streams; a
  cursor advances only after successful send. Fifteen-second comment-only heartbeats
  do not mutate the cursor. Completion, timeout, error and failed send clean up
  idempotently.
- C2-02 is locally implemented: shared TEACHER/STUDENT stream transport and
  cookie-authenticated `GET /api/race-players/me/events/stream`. Student signals
  expose only version/type/time; replay uses committed rows without payload decoding,
  gameplay locks or presence writes. Teacher stream behavior remains unchanged.
- Live-state remains the complete initial/recovery query. The legacy generic
  `/api/sse` implementation is unchanged and unused by S2; Redis is not event truth.
  Cross-node fanout remains later production scaling work.

### RacePlayer flow

- race participant entity with lane/vehicle/runtime fields
- join by room code
- capacity/status checks
- separate race-player token/cookie
- lane and vehicle assignment
- race-state with refresh-safe current-player presentation identity and the shared
  runtime snapshot
- authoritative standings in the shared race-state, submit-answer and
  finish-arbitration snapshot: competition rank, actual joined-player count and the
  full safe `opponents` roster (every other joined player, 0..7, standing order).
  FINISHED uses the canonical `finishedAtEpochMs` (legacy `finishedAt` fallback); all
  other statuses, including DISCONNECTED, use stored position. Lane/ID stabilize
  tied output only and never decide public rank
- Redis-first heartbeat and presence with 45-second presence TTL; only heartbeat
  and reconnect create or renew the lease. Active `RACING + IN_PROGRESS`
  race-state, current-question and answer requests record trusted gameplay activity.
  Absent active requests settle to the trusted cutoff and return
  `RACE_PLAYER_RECONNECT_REQUIRED` without activity or re-anchor. Finished,
  disconnected and terminal-race race-state remains readable without consulting
  presence or writing activity; terminal state reached during request settlement
  also wins over the older presence decision. Heartbeat renews an existing lease but
  a missing lease requires explicit reconnect and cannot trigger reconnect settlement
  or re-anchor; schedulers never refresh activity.
- 30-second Redis-gated durable `lastSeenAt` checkpoints and direct MySQL fallback
  during runtime Redis outages.
- reconnect using the freshest trusted gameplay activity, durable `lastSeenAt` and race start,
  with a 5-minute grace period and a 30-second DB-only fallback margin.
- core runtime actions have a frozen repeat policy: race-state and heartbeat are
  repeat-safe; reconnect re-anchors only a real resume; duplicate leave is
  state-idempotent; current-question preserves the same ACTIVE identity/deadline;
  duplicate answer never applies gameplay mutation twice.
- leave/disconnect persistence remains authoritative when Redis cleanup fails;
  repeated leave after DISCONNECTED skips settlement, activity and duplicate save
  while retaining best-effort offline cleanup. FINISHED remains FINISHED.
- `POST /api/race-players/me/focus-events` accepts only a UUID `eventId` and
  `TAB_HIDDEN`/`TAB_VISIBLE`. The current RacePlayer is locked before idempotency
  lookup; same-ID replay returns stored counters/outcome/time, while a conflicting
  type returns `FOCUS_EVENT_REPLAY_CONFLICT`.
- `RacePlayer.focusLossCount`, `lastFocusLossAt` and `focusState` own the durable race
  summary. `race_player_focus_events` owns the immutable audit decision, optional
  server-resolved PlayerQuestion association, counters-after and server time, with a
  unique `(race_player_id, client_event_id)` constraint.
- The new non-null RacePlayer summary columns declare database defaults of `0` and
  `VISIBLE`, so DEV `ddl-auto=update` can backfill existing rows safely. No production
  migration exists yet; that remains Phase 6 debt.
- A visible→hidden transition counts only for an unexpired ACTIVE question during
  `RACING + IN_PROGRESS`: first loss on that question is WARNING and second+ is
  VIOLATION under WARN.
- `Race.focusPolicy` persists OFF/WARN/STRICT with non-null DB default `WARN` and is
  selected optionally during race creation; teacher summary and room responses expose
  it. OFF ignores without counting. STRICT classifies the third counted loss on one
  ACTIVE question as FORFEITED.
- Strict forfeit delegates EXPIRED and the exactly-once timeout consequence to
  `QuestionTimeoutService`, using a read-only trusted activity cutoff from the
  presence owner. It records no activity, renews no lease, reconnects/re-anchors
  nothing, creates no next question and does not remove the RACING player. Redis
  outage uses durable lastSeen/race-start fallback.

### Server time policy (C1-02K)

- One configured application `ZoneId` (`QUIZWHEELZ_TIME_ZONE`, default
  `Asia/Jerusalem` — matching the dev MySQL `serverTimezone` and existing
  zone-less rows) and ONE shared injected `Clock` bean (`TimeConfig`).
- Correctness-sensitive services (question delivery/persistence/cleanup,
  answers, runtime session, race start/finish) use the injected Clock; no
  service creates its own `Clock.systemDefaultZone()`.
- Legacy static/JPA `LocalDateTime.now()` calls (BaseEntity, ApiResponse,
  ErrorResponse, SSE) follow the JVM default zone, which TimeConfig aligns
  to the application zone at startup.
- Durable MySQL model keeps `LocalDateTime` for now; Redis runtime
  timestamps are Unix epoch milliseconds/`Instant`; timing-critical client
  contracts (current question, submit answer) expose epoch milliseconds
  only. A future DB migration to Instant/UTC is separate production work.
- `DateTimeUtils` is pure conversion/comparison — it never decides "now".

### Question flow

- reusable `QuestionTemplate`
- template selection
- operator/difficulty generation patterns
- unique four-choice generation
- generated question and choice persistence
- current-question delivery: POST resolve on the same path (the operation can
  expire/create questions, so it is not a safe GET), serialized per
  RacePlayer with the existing PESSIMISTIC_WRITE row lock BEFORE the
  ACTIVE-question lookup — concurrent requests cannot create two ACTIVE
  questions; the LOCKED player/race lifecycle is revalidated after the lock
  (the pre-lock check is only a cheap early rejection), so a player finished
  by a concurrent answer can never receive a fresh question; one decision
  instant serves both the expiry check and the returned `serverTimeEpochMs`;
  the QuestionPlan is built under the lock only when a new question is
  needed
- expiry handling
- safe DTOs with epoch-millisecond timing (`serverTimeEpochMs` +
  `expiresAtEpochMs`; submit-answer exposes `answeredAtEpochMs` +
  `expiresAtEpochMs`)
- frozen ObjectMapper serialization/no-leak coverage for the public race-state,
  current-question, submit-answer, heartbeat, leave and reconnect contracts
- answer validation and persistence
- duplicate-submit and terminal-state answer protection: DISCONNECTED, FINISHED-player
  and FINISHED-race submissions cannot mutate the question or invoke engine policies;
  an already-ANSWERED question cannot apply a second gameplay effect.
- ACTIVE question ownership and the original `expiresAt` survive hidden, reload and
  reconnect transitions. An overdue ACTIVE question becomes EXPIRED exactly once
  before a next question can be created; reconnect itself never creates a question.

### Race engine

- score delta
- progress bonus (correct answers only) + presence-bounded CONTINUOUS authoritative
  movement (C1-03M/S1-01B): while RACING and trustworthy presence is active,
  `position` advances by
  `elapsed x speed x BASE_MOVEMENT_UNITS_PER_SECOND` from the
  `movementUpdatedAtEpochMs` anchor (`RaceMovementService`, epoch-ms math —
  DST-proof; old speed owns past time, boosts/penalties own only the
  future). Real absence caps settlement at the last trusted activity; reconnect
  re-anchors at now and never awards the offline interval. Projection is integer
  tick math (`RaceMovementCalculator`: 1/10,000-unit position ticks, 0.1 speed
  tenths), partition-invariant, and the anchor stops at the exact finish-crossing
  instant, which becomes the canonical `finishedAtEpochMs`.
- speed: bounded cumulative model — race start grants `MIN_RACING_SPEED`
  (0.5) + the movement anchor; correct answers ADD +0.20/+0.30/+0.40 by
  difficulty up to MAX 2.0; wrong −0.20 and timeout −0.40 floor at the
  minimum; FINISHED returns to 0
- timeout is a real gameplay event with ONE exactly-once owner
  (`QuestionTimeoutService`) and correct chronology: only when the trusted movement
  cutoff has reached the deadline does it settle to the deadline at the old speed,
  mark ACTIVE→EXPIRED, apply the penalty + wrong/failure progression and settle the
  remainder to `min(decision, cutoff)`; while the cutoff is earlier than the
  deadline it settles to the cutoff only and the question stays ACTIVE without
  penalty. The deadline is never extended: reconnect re-anchors and then resolves
  the overdue question at that instant, submit-answer rejects an overdue question
  even while ACTIVE, and a player becoming DISCONNECTED has the leftover question
  expired without consequence
- safety settlement scheduler (5s) + per-player locked worker: connected movement,
  overdue timeouts, grace-expiry DISCONNECTED and race finish need no gameplay
  request; reconciliation can ignore RACING players after the short presence-loss
  boundary, so reconnect grace does not block the class; before persisting race
  FINISHED it normalizes every absent non-blocking active-status player, preventing
  a finished race from retaining WAITING/RACING rows
- GET race-state settles the locked player to one decision instant before
  mapping (safe state-read materialization — repeated reads award nothing);
  RACING→DISCONNECTED settles first, FINISHED wins over DISCONNECTED
- runtime snapshot carries `snapshotAtEpochMs` (client freshness ordering),
  `positionAtEpochMs` (durable movement anchor), `movementUnitsPerSecond`
  (server-owned visual prediction rate), `playerFinishedAtEpochMs`, non-null
  `eventVersion` (race version after the request's own durable events), `rank`,
  `playerCount` and the full `opponents` roster; one focused standings owner reads
  the at-most-8 RacePlayers once and computes rank/opponents in memory after the
  current request mutation
- streak/highest streak
- difficulty progression
- correct/wrong counters
- player finish with canonical `finishedAtEpochMs` (answer decision instant or
  deterministic crossing instant; `finishedAt` derived from the same instant)
- basic race finish
- answer response with reusable runtime snapshot
- `POST /api/race-players/me/finish-arbitration` (C2-01): cookie-only identity,
  scalar preflight, all RacePlayers locked by id then the Race, one decision
  instant, requester through the gameplay guard and other RACING players through
  the background presence path, batch events, race finish, shared snapshot and a
  `RaceFinishOrderPolicy` confirmed finish-order prefix; an effective decision time behind the roster
  settles nothing and returns the snapshot unproven.
- Arbitration alone uses READ_COMMITTED. Arbitration and active answers share
  the persisted race-local decision time floor documented in the architecture contract.

Redis infrastructure failure is not absence: gameplay presence fails open, no racer
is frozen or disconnected en masse, durable `lastSeenAt` remains available, and
recovery never subtracts movement awarded in degraded mode.

## Partial or missing

- C2-04 finish presentation and subsequent teacher race UI remain deferred.
- Durable final-results query/model closure.
- Event/effect system for junction/luck/announcements.
- Catch-up-assistance policy.
- Registration, email verification, reset and 2FA.
- Database migrations and production deployment.

## Development configuration

The development profile connects to the developer-owned MySQL database at
`localhost:3306/quiz_wheelz`. Spring Boot owns the Redis-only `server/compose.yaml`
lifecycle with `start-and-stop`, waits for its health check and applies the dynamic
localhost service connection. Tests use H2 and keep Docker Compose disabled.

S0-02 is implemented and verified. Automated and DEV runtime verification covers
Redis-first checkpoints, reachable-but-missing key rehydration, DB fallback,
runtime-outage heartbeat/reconnect, durable leave, recovery on the same Redis
endpoint, and the live 5-minute-30-second expiry boundary.

A separate DEV infrastructure limitation remains: a literal Redis container
stop/start can allocate a new dynamic host port, while the already-running Spring
Boot service connection remains bound to the startup endpoint. Pause/unpause
preserves that endpoint and successfully verified S0-02 runtime outage and recovery.
Changing this lifecycle/port behavior is outside S0-02.

## Current server priority

```text
Infrastructure reliability
→ student playable-loop contract closure
→ teacher live-state/SSE
→ results
→ game events
→ full auth/2FA
```
