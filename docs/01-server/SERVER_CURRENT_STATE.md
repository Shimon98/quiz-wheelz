# Server Current State

**Status:** Canonical  
**Audit date:** 2026-08-19
**Code baseline:** `main@74402e6a8d702ca0299568e2130ce88dcb7a3917`
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

### RacePlayer flow

- race participant entity with lane/vehicle/runtime fields
- join by room code
- capacity/status checks
- separate race-player token/cookie
- lane and vehicle assignment
- race-state with refresh-safe current-player presentation identity and the shared
  runtime snapshot
- authoritative standings in the shared race-state and submit-answer snapshot:
  competition rank, actual joined-player count and a deterministic max-4 safe nearby
  window. FINISHED uses `finishedAt`; all other statuses, including DISCONNECTED, use
  stored position. Lane/ID stabilize tied output only and never decide public rank
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
- leave/disconnect persistence that remains authoritative when Redis cleanup fails.

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
- duplicate-submit protection.
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
  re-anchors at now and never awards the offline interval.
- speed: bounded cumulative model — race start grants `MIN_RACING_SPEED`
  (0.5) + the movement anchor; correct answers ADD +0.20/+0.30/+0.40 by
  difficulty up to MAX 2.0; wrong −0.20 and timeout −0.40 floor at the
  minimum; FINISHED returns to 0
- timeout is a real gameplay event with ONE exactly-once owner
  (`QuestionTimeoutService`): settle to the deadline at the old speed,
  ACTIVE→EXPIRED, penalty + wrong/failure progression, settle the remainder;
  its wall clock continues while absent even though movement stays capped
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
  `movementUnitsPerSecond` (server-owned visual prediction rate), `rank`,
  `playerCount` and `nearbyPlayers`; one focused standings owner reads the at-most-8
  RacePlayers once and computes rank/window in memory after the current request mutation
- streak/highest streak
- difficulty progression
- correct/wrong counters
- player finish
- basic race finish
- answer response with reusable runtime snapshot.

Redis infrastructure failure is not absence: gameplay presence fails open, no racer
is frozen or disconnected en masse, durable `lastSeenAt` remains available, and
recovery never subtracts movement awarded in degraded mode.

## Partial or missing

- Teacher live-state query.
- Teacher SSE stream.
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
