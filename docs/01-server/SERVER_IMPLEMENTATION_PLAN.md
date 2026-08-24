# Server Implementation Plan

**Status:** Canonical  
**Audit date:** 2026-08-23
**Code baseline:** `main@14f16e8d91c522a1f6d44129b1bf5e89e107f3a2`
**This document owns:** the ordered backend task list with dependencies and integration outputs

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Task metadata format

Every server task/issue should begin with:

```yaml
id: S1-01
status: DONE
area: server
depends_on: [S0-02, S1-01A]
blocks: [C1-06]
contract_owner: server
```

## S0 — Development infrastructure and runtime reliability

### S0-01 — Local MySQL and automatic Redis

**Status:** `DONE`

- keep DEV MySQL on the existing local `localhost:3306/quiz_wheelz` database
- create one backend-owned Compose file for Redis
- add a Redis health check
- let Spring Boot start/stop Redis
- remove Redis ignore-label/mixed ownership
- tests must not start Compose
- verify the local development workflow.

**Output:** reproducible dev environment.

**Verification:** DEV MySQL is the developer's existing local service at
`localhost:3306/quiz_wheelz`; Docker Compose does not own it. `server/compose.yaml`
owns only DEV Redis through Spring Boot's `start-and-stop` lifecycle, with a health
check and a dynamic localhost-only port supplied through the Compose service
connection. Ordinary tests use H2 and keep Docker Compose and Redis disabled. The
shared IntelliJ configuration keeps the backend working directory at `server` so
automatic Redis startup resolves the Compose file correctly.

### S0-02 — Durable heartbeat fallback

**Status:** `DONE`

- keep the 45-second Redis presence TTL and exact Redis heartbeat timestamp
- gate targeted, monotonic `RacePlayer.lastSeenAt` updates in Redis at one update
  opportunity per RacePlayer every 30 seconds
- fall back to a direct durable checkpoint when Redis fails at runtime
- use a 5-minute reconnect grace period
- reconnect activity precedence:

```text
Redis last heartbeat
DB lastSeenAt
race startedAt
→ choose the freshest trustworthy timestamp
```

- apply the shared 30-second checkpoint interval as a safety margin only when the
  Redis heartbeat is missing or unusable and the decision relies on durable state
- keep durable leave/disconnect changes when Redis cleanup fails
- automated unit, repository and full Maven verification pass
- DEV startup, Redis-first throttling, missing-key rehydration, DB fallback,
  runtime-outage heartbeat/reconnect, durable leave, same-endpoint Redis recovery and
  the live 5-minute-30-second expiry boundary pass

**DEV infrastructure limitation:** a literal Redis container stop/start can allocate
a new dynamic host port, while the already-running Spring Boot service connection
remains bound to the startup endpoint. Pause/unpause preserves the endpoint and
successfully verified S0-02 runtime outage and recovery. Changing S0-01's dynamic-port
lifecycle is outside S0-02 and does not block it.

**Blocks:** reliable client reconnect integration.

### S0-03 — Runtime dependency/config cleanup

**Status:** `DONE`

- kept Spring Boot Docker Compose as the optional DEV dependency
- cleaned redundant base Redis connection properties
- preserved active Redis runtime policy configuration
- corrected the OpenAPI project description
- removed generated server HELP boilerplate
- synchronized canonical DEV/current-state documentation
- intentionally deferred WebSocket cleanup because it does not block S1.

## S1 — Student playable-loop contract closure

### S1-01 — Verify and freeze student contracts

**Status:** `DONE (2026-08-19)`

- verified race-state, current-question, answer-impact, heartbeat, leave and reconnect
  against the actual controller/DTO/service/client source
- added refresh-safe current-player presentation identity to race-state without
  duplicating `snapshot.playerStatus`
- centralized `vehicleAssetKey` construction in `RacePlayerRules`
- confirmed all six endpoint mappings use `ApiPaths` and froze their HTTP methods
- added exact-field ObjectMapper serialization/no-leak tests for all six public
  contracts
- protected the four-choice production Math seed rule while retaining the generic
  2–6-choice generator capability
- synchronized the canonical server/client contract documentation; existing client
  endpoint constants already matched and required no production-code change.

### S1-01A — Authoritative continuous movement contract

**Status:** `DONE (2026-08-19, C1-03M)`

- `RacePlayer.movementUpdatedAtEpochMs` movement anchor (epoch ms — elapsed
  math is DST-proof; every entry into RACING re-anchors it)
- `RaceMovementService` — the ONE settlement owner:
  `position += elapsed x speed x BASE_MOVEMENT_UNITS_PER_SECOND (4.0)`,
  clamped at totalDistance; old speed owns past time, a boost/penalty owns
  only the future; finish-by-time expires a leftover ACTIVE question
- bounded cumulative speed policy: correct adds +0.20/+0.30/+0.40 by
  difficulty up to MAX 2.0; wrong −0.20, timeout −0.40, floor MIN 0.5
- `QuestionTimeoutService` — exactly-once timeout owner (settle→deadline at
  the old speed, ACTIVE→EXPIRED, penalty + wrong/failure progression,
  settle the remainder at the new speed); delivery, late submit, race-state
  and the scheduler all route through it
- `RaceMovementSettlementScheduler` + per-player transactional worker every
  5s — movement, overdue timeouts and guaranteed finish need NO client
  request; plus the race-finish reconciliation pass (IN_PROGRESS races with
  no WAITING/RACING players are finalized under a race lock — concurrent
  player finishes can no longer strand a race)
- GET race-state now settles the locked player to one decision instant
  before mapping (a safe state-read that materializes deterministic elapsed
  state; repeated reads award nothing)
- snapshot contract adds `snapshotAtEpochMs` (client freshness ordering) and
  `movementUnitsPerSecond` (server-owned visual prediction rate)
- RACING→DISCONNECTED transitions settle movement first; FINISHED wins over
  DISCONNECTED
- schema note: `movement_updated_at_epoch_ms` is created by the DEV
  `ddl-auto=update` mechanism (verified locally; Diana's DEV DB gets it the
  same way) — production migrations remain Phase 6 debt.

### S1-01B — Freeze movement during real absence

**Status:** `DONE (2026-08-20)`

- one monotonic latest-trusted-gameplay-activity concept; heartbeat/reconnect and
  online race-state/current-question/answer requests record activity
- presence lease ownership is separate: only heartbeat and reconnect create or
  renew the 45-second lease when semantically valid; heartbeat may renew an existing
  lease but a missing lease returns `RACE_PLAYER_RECONNECT_REQUIRED` without
  reconnect settlement, re-anchor or lease recreation
- one gameplay-request access guard enforces presence only for active
  `RACING + IN_PROGRESS` race-state/current-question/answer calls and rejects absent
  active calls with `RACE_PLAYER_RECONNECT_REQUIRED`; terminal/non-playable
  race-state remains readable without presence or activity writes, and only explicit
  reconnect may re-anchor the timeline. Terminal state reached during settlement
  wins over the request's older reconnect-required/window-expired decision
- absent settlement is capped at that activity, repeated sweeps cannot move it,
  and reconnect re-anchors without catch-up
- question deadlines are never shifted: `QuestionTimeoutService` processes an
  overdue ACTIVE question exactly once against wall-clock time while using an
  independent movement cutoff
- ACTIVE question ownership survives hidden, reload and reconnect; reconnect never
  generates a replacement question, so lifecycle changes cannot enable fishing
- 45s presence loss permits race completion to ignore an absent RACING player;
  the unchanged 5-minute grace remains a return window and expiry durably becomes
  DISCONNECTED if the race is still active
- Redis outage fails open for movement/presence and cannot mass-freeze,
  mass-disconnect, or subtract previously awarded movement

### S1-02 — Authoritative rank and nearby-player snapshot

**Status:** `DONE (2026-08-23)`

Define only fields the client truly needs:

```json
{
  "rank": 2,
  "playerCount": 5,
  "nearbyPlayers": [
    {
      "racePlayerId": 91,
      "displayName": "Noa",
      "laneNumber": 3,
      "vehicleTypeKey": "HOVER_KART",
      "vehicleColorKey": "GREEN",
      "position": 420,
      "speed": 1.3,
      "status": "RACING"
    }
  ]
}
```

Implemented rules:

- `StudentRaceStandingService` performs one existing RacePlayer list read and owns the
  in-memory standing/window calculation for races capped at 8 players
- all joined players count; FINISHED precedes non-finished and earlier `finishedAt`
  wins; active/waiting/disconnected players rank by stored authoritative position
- exact finish-time or position ties use competition rank; deterministic ID/lane
  ordering affects response order only and never changes public rank
- nearby selection excludes self, returns at most 4, prefers 2 ahead + 2 behind and
  fills from the available side without changing authoritative depth
- race-state and submit-answer map the same extended runtime snapshot after their
  authoritative in-transaction mutation; the mapper remains repository-free
- the safe nearby DTO exposes only identity, lane/vehicle, position, speed and status;
  exact-field serialization tests prevent sensitive/internal leakage.

**Blocks:** opponent layer and rank HUD.

### S1-03 — Runtime action hardening

**Status:** `DONE (2026-08-23)`

- race-state refresh is repeat-safe for waiting, active-online and terminal states;
  an absent active player still requires explicit reconnect and refresh never creates
  presence, re-anchors movement or creates another RacePlayer
- heartbeat is repeat-safe and renews only an existing valid lease; duplicate
  reconnect re-anchors only the real absent→resumed transition; repeated terminal
  reconnect outcomes remain stable
- leave is state-idempotent: an already-DISCONNECTED player skips settlement,
  activity and duplicate persistence while best-effort offline cleanup remains allowed
- current-question returns the same ACTIVE question with its original deadline;
  an overdue ACTIVE question times out once and only then is one next question created
- answer owns exactly-once gameplay mutation: terminal-state answers and a duplicate
  submit for a no-longer-ACTIVE question are rejected without a second engine effect
- no public endpoint, DTO, ErrorCode, schema or Redis contract changed.

#### S1-03A — Focus integrity foundation

**Status:** `DONE (2026-08-23)`

- added session-owned `POST /api/race-players/me/focus-events` with UUID event ID,
  `TAB_HIDDEN`/`TAB_VISIBLE`, exact safe response fields and no target IDs/timestamps
- persisted cumulative `focusLossCount`, `lastFocusLossAt`, `focusState`, and focused
  audit rows with optional server-resolved ACTIVE-question association and unique
  `(race_player_id, client_event_id)` replay protection
- same ID/type returns the original stored result; conflicting type is rejected;
  first counted loss per question is WARNING and second+ is VIOLATION while the race
  total remains cumulative across questions
- WAITING/terminal/non-playable/missing-or-expired-question hidden events are IGNORED;
  repeated hidden/visible transitions are safe and auditable
- focus detection is isolated from presence, activity, movement/re-anchor, reconnect,
  question timeout/answer and every gameplay mutation
- the non-null RacePlayer focus summary columns carry DB defaults (`0` / `VISIBLE`)
  so DEV `ddl-auto=update` can backfill existing rows safely; production migration
  remains Phase 6 debt, and no Redis focus state was added.

#### S1-03B — Strict focus policy

**Status:** `PLANNED`

```text
first focus loss
→ warning

second repeated focus loss
→ stronger warning / integrity violation

third repeated focus loss
→ ACTIVE question may be forfeited as timeout
```

Ordinary focus loss does not automatically remove a player from the race. The
teacher-selected future policy is `OFF` for normal absence/reconnect behavior,
`WARN` for tracking and warnings, or `STRICT` for repeated-loss question
forfeiture. Exact thresholds remain an S1-03 implementation decision. S1-01B owns
neutral absence/return correctness; S1-03 owns intentional abuse detection and
consequences. Complete this foundation before teacher live/SSE work.

## S2 — Teacher live race and SSE

### S2-01 — Teacher live-state query

Return a projector-ready initial state:

```text
race details
server time
status
total distance
players
rank/position/speed/score/streak/status
event cursor/version
```

Enforce teacher ownership.

### S2-02 — Live event model

Create a focused event/snapshot vocabulary:

```text
PLAYER_JOINED
RACE_STARTED
QUESTION_ANSWERED
PLAYER_PROGRESS_UPDATED
PLAYER_FINISHED
RACE_FINISHED
```

Do not add luck/junction events until their engines exist.

### S2-03 — SSE stream

- teacher-owned stream
- heartbeat/comment frames
- event IDs or version cursor
- reconnection support
- initial query remains the recovery path
- disconnect cleanup
- concurrency tests.

**Blocks:** client teacher live screen.

## S3 — Results

### S3-01 — Final ranking and result query

- deterministic ranking
- final score, correct/wrong, best streak, finish time
- race winner
- idempotent race completion.

### S3-02 — Dashboard active/finished navigation support

Expose the minimal status/links required by the client without UI-specific fields.

## S4 — Required game events

### S4-01 — Shared effect/event foundation

Add only the fields required by the first real effects. Avoid speculative unused
entities.

### S4-02 — Junction policy

- eligibility meter/probability
- one active offer per player
- expiry/recovery behavior
- persisted choice.

### S4-03 — Highway and dirt-road execution

- highway hard question + high reward/penalty
- dirt-road easy sequence + lower safe reward
- clear ratio and tests.

### S4-04 — Fair luck policy

- weighted events
- cooldowns
- maximum negative streak
- no event that determines the whole race alone.

### S4-05 — Catch-up assistance

Eligibility requires both:

```text
actually behind
AND demonstrably struggling
```

Never grant assistance solely because a leading player intentionally answers wrong.

## S5 — Full auth and 2FA

Follow `AUTH_REGISTRATION_AND_2FA.md`.

## S6 — Production

- migrations
- secret management
- secure cookies/CORS/CSRF review
- CI
- deployment
- load and observability.
