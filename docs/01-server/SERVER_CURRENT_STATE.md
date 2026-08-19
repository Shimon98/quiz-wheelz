# Server Current State

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
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
- race-state snapshot
- Redis-first heartbeat and presence with 45-second presence TTL.
- 30-second Redis-gated durable `lastSeenAt` checkpoints and direct MySQL fallback
  during runtime Redis outages.
- reconnect using the freshest Redis heartbeat, durable `lastSeenAt` and race start,
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
- answer validation and persistence
- duplicate-submit protection.

### Race engine

- score delta
- progress/position
- speed (race start moves WAITING→RACING players to `MIN_RACING_SPEED`, so
  the race feels alive before the first answer; wrong answers floor at the
  same minimum, FINISHED returns to 0 — C1-03)
- streak/highest streak
- difficulty progression
- correct/wrong counters
- player finish
- basic race finish
- answer response with reusable runtime snapshot.

## Partial or missing

- Teacher live-state query.
- Teacher SSE stream.
- Nearby-player/rank data needed by student opponents/HUD.
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
