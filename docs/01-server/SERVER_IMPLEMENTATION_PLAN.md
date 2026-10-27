# Server Implementation Plan

**Status:** Canonical  
**Audit date:** 2026-10-07
**Code baseline:** `main@5817af3b344fc22fc5007398412815523fedc128`
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

Superseded by C2-01 (2026-09-10): the max-4 `nearbyPlayers` window became the full
`opponents` roster and FINISHED ordering uses `finishedAtEpochMs`.

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

**Status:** `DONE (2026-08-24)`

- added durable `RaceFocusPolicy` OFF/WARN/STRICT with explicit WARN service default
  and DB default for existing-row DEV `ddl-auto=update` compatibility
- race creation accepts optional `focusPolicy`; teacher race summary and room
  responses expose the persisted policy
- OFF persists ignored, uncounted focus audit results; WARN preserves S1-03A first
  WARNING and second+ VIOLATION behavior without gameplay consequence
- STRICT classifies loss 1 as WARNING, loss 2 as VIOLATION and loss 3 on the same
  ACTIVE question as FORFEITED; a new question starts again at 1
- strict forfeit reuses `QuestionTimeoutService` for ACTIVE→EXPIRED and timeout engine
  impact exactly once, without generating the next question or removing the player
- focus obtains a read-only trusted movement cutoff from the presence owner and never
  records activity, renews presence, reconnects or re-anchors; durable fallback
  prevents request-time absence catch-up during Redis outage
- historic FORFEITED replay bypasses timeout/movement/engine mutation; conflicting
  replay remains `FOCUS_EVENT_REPLAY_CONFLICT` 3028/409
- production migration remains Phase 6 debt; client integration and teacher live/SSE
  remain future work.

## S2 — Teacher live race and SSE

### S2-01 — Teacher live-state query

**Status:** `DONE (2026-08-24)`

Implemented a projector-ready initial/recovery state:

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

- dedicated `GET /api/teacher/races/{raceId}/live-state`; the lobby `/room` contract
  remains unchanged
- exact top-level and player DTO fields with `focusPolicy`, injected-clock
  `serverTimeEpochMs`, server-owned `baseMovementUnitsPerSecond`, and no
  internal/question/focus-audit/presence leakage
- C3-00 companion (2026-09-14): the same DTO also exposes
  `startedAtEpochMs` / `finishedAtEpochMs` from `Race.startedAt` /
  `Race.finishedAt` through `DateTimeUtils.toEpochMilli(value, clock.getZone())`
  behind a null guard in `TeacherRaceLiveStateService`; the serialization, service and
  controller tests lock the 12-field set; no endpoint, entity, migration, SSE, ranking
  or `DateTimeUtils` change
- teacher ownership reuses the room lookup sequence and returns `RACE_NOT_FOUND` for
  missing and foreign Races
- one RacePlayer list fetch followed by one shared pure standing calculation used by
  both teacher live-state and unchanged student standing/window behavior
- all joined statuses are included; FINISHED/finish-time and non-finished/position
  semantics use competition ties with deterministic output order
- durable non-null `Race.liveEventVersion` / `live_event_version` defaults to `0` at
  entity and DB levels; the GET reads without incrementing
- query is read-only and has no Redis, presence, gameplay activity, movement,
  timeout, reconnect, re-anchor, save or event-publication dependency
- S2-02 owns durable event vocabulary/version increments and S2-03 owns SSE; the new
  column uses DEV `ddl-auto=update`, while production migrations remain Phase 6 debt.

### S2-02 — Live event model

**Status:** `DONE (2026-08-24)`

Implemented the focused event/snapshot vocabulary:

```text
PLAYER_JOINED
RACE_STARTED
QUESTION_ANSWERED
PLAYER_PROGRESS_UPDATED
PLAYER_FINISHED
RACE_FINISHED
```

Do not add luck/junction events until their engines exist.

- durable `RaceLiveEvent` table with unique/indexed `(race_id, version)`, injected-
  Clock epoch time and typed JSON payload
- atomic database-owned per-Race `Race.liveEventVersion` allocation; no Redis or JVM
  sequence
- active player mutations use one per-Race pessimistic live-mutation gate after the
  authoritative RacePlayer lock and before settlement or snapshot reads; therefore
  mutation serialization order, full-player snapshot order and event-version order
  are identical
- WAITING heartbeat/leave/reconnect paths do not acquire the Race gate or emit
  `PLAYER_PROGRESS_UPDATED`; join/start remain Race-first, while finalization retains
  ordered player locks followed by the Race lock
- existing authoritative transaction is mandatory, so domain mutation, cursor and
  event row commit or roll back together
- join/start/answer and visible movement/timeout/disconnect/reconnect/finalization
  boundaries wired without moving event ownership into inner engines
- `QUESTION_ANSWERED` precedes progress/player-finish/race-finish events from the same
  answer
- shared full-player authoritative ranking snapshots, including overtake changes and
  competition ties
- teacher live-state adds `baseMovementUnitsPerSecond` from `RaceProgressRules` and its
  `eventVersion` exposes the highest committed durable cursor
- student `movementUnitsPerSecond` remains the effective per-player rate; teacher
  full-player snapshots expose durable authoritative positions without promising a
  shared movement anchor at `serverTimeEpochMs` or event `occurredAtEpochMs`, so the
  future projector interpolates toward server positions and never advances truth
- bounded caller-sized repository cursor retrieval exists; S2-02 added no teacher-
  owned event endpoint or SSE transport. The pre-existing generic `/api/sse`
  infrastructure remains legacy, is not the durable event cursor/replay owner and
  was not adopted or redesigned; Redis remains outside event truth and no client
  change was added
- DEV schema creation is safe; production migration remains Phase 6 debt.

### S2-03 — SSE stream

**Status:** `DONE (2026-08-25)`

- dedicated teacher-owned `GET /api/teacher/races/{raceId}/events/stream`
- raw `afterVersion`/`Last-Event-ID` binding with header-source precedence before
  parsing, cursor `0` support and focused invalid-selected-cursor error 3029
- existing envelope sent as SSE data with durable version as the sole SSE ID
- shared injected-`ObjectMapper` payload codec for all six write/replay types
- committed MySQL Race-scoped replay in ascending cursor order, bounded to 100 rows
  per read with no unpaged or page-number continuation
- reusable teacher Race access owner for room, live-state, start locking and stream
- process-local server-identified registry with independent per-connection cursors
- one-second dispatcher on a dedicated non-default single-thread teacher-live
  scheduler, isolated from authoritative gameplay maintenance scheduling
- per-connection dispatch lock and post-send-only advancement, with deterministic
  overlapping-dispatch proof of one replay, one send and one cursor advancement
- 15-second comment-only heartbeat with no ID, durable payload, persistence or Redis
- idempotent completion, timeout, error and send-failure cleanup
- live-state remains the complete initial/recovery path; legacy `/api/sse` remains
  unchanged and unused by S2; cross-node fanout remains later production work
- deterministic cursor, replay, codec, isolation, failure, cleanup, heartbeat and
  snapshot-to-stream race tests.

**Blocks:** client teacher live screen.

## C2 — Competition truth (server side of the client C2 phase)

### C2-01 — Competition truth and finish arbitration

**Status:** `DONE (2026-09-10)`

```yaml
id: C2-01
status: DONE
area: server
depends_on: [S1-02, S2-02]
blocks: [client C2 opponents, C2-02]
contract_owner: server
```

- deterministic movement: `RaceMovementCalculator` projects in 1/10,000-unit
  position ticks and 0.1 speed tenths (`ticksPerMs = 4 × speedTenths`, MAX 2.0 =
  80 ticks/ms), is partition-invariant and stops the anchor at the exact
  finish-crossing instant; `RaceMovementService` only applies its projection
- canonical finish time: `RacePlayer.finishedAtEpochMs` (new nullable column
  `finished_at_epoch_ms`, DEV `ddl-auto=update`); `finishedAt` is derived from the
  same instant; answer finishes stamp the answer decision instant, movement finishes
  stamp the crossing instant; standing and the finish live event fall back to legacy
  `finishedAt` for rows written before C2-01
- timeout chronology without a new state machine: an overdue ACTIVE question whose
  expiry lies beyond the trusted movement cutoff is deferred (settle to the cutoff
  only, stays ACTIVE, no penalty); an expiry at or before the cutoff settles to the
  expiry at the old speed, marks EXPIRED, applies the exactly-once penalty and
  settles to `min(decision, cutoff)`; reconnect re-anchors first and then resolves
  the overdue question at the decision instant (no hidden movement); a player that
  becomes DISCONNECTED (leave, grace expiry, finalization) has the leftover ACTIVE
  question expired without consequence; submit-answer rejects an overdue question
  explicitly (`QUESTION_EXPIRED`) even while its status is still ACTIVE
- snapshot contract: `nearbyPlayers` → `opponents` (every other joined player,
  0..7, standing order; `StudentRaceOpponentResponse` with rank, position,
  positionAtEpochMs, movementUnitsPerSecond, status, finishedAtEpochMs and the
  lane/vehicle identity incl. `vehicleAssetKey`); new snapshot fields
  `positionAtEpochMs`, `playerFinishedAtEpochMs` and non-null `eventVersion`, read
  from `Race.liveEventVersion` after the request's own durable events are recorded
- `POST /api/race-players/me/finish-arbitration`: cookie-only identity, scalar
  preflight (`existsByIdAndRaceId`, `findStatusById`, no entity loads), then all
  RacePlayers locked by id → Race lock → revalidation → one decision clock read →
  requester settled through the gameplay guard (RACING only), other RACING players
  settled through the background presence path with their own cutoffs → batch
  player events → race finish → race event → standing → snapshot →
  `RaceFinishOrderPolicy` confirmed finish-order prefix (bound = min(T−1, earliest
  MAX-speed crossing − 1); FINISHED without epoch, WAITING or anchorless RACING →
  unproven); IN_PROGRESS settles, FINISHED returns durable truth, anything else
  `RACE_NOT_IN_PROGRESS`; an effective decision time behind the roster settles nothing and returns
  unproven; `noRollbackFor = ApiException`, requester-guard rejection still records
  the roster changes
- arbitration alone uses READ_COMMITTED; arbitration and active answers advance
  a persisted race-local decision time floor under the existing Race lock, as
  defined in `../00-project/ARCHITECTURE_AND_CONTRACTS.md`.
- pre-existing fix: `resolveCurrentRacePlayerIdentity` no longer opens a read-only
  transaction, so a missing/invalid cookie returns 401 instead of 500 on every
  `noRollbackFor` race-player endpoint
- deferred to later C2 phases: student SSE, accumulator, geometry and a
  project-wide clock.

**Blocks:** client C2 opponents renderer, student live stream.

## S3 — Results

### S3-01 — Final ranking and result query

**Status:** `DONE (2026-09-20)`

- added TEACHER-only `GET /api/teacher/races/{raceId}/results` with existing ownership
  hiding and FINISHED-only availability; every other status returns 3030/409
- reused the single `RaceStandingCalculator` owner once per response, including exact
  epoch finish ordering, legacy application-zone fallback, competition ties and
  stable output order
- reuses `SubjectResponse`, returns lifecycle epochs and every participant with final
  rank/result fields, all rank-1 FINISHED winner IDs, and a zero-safe summary containing
  only finished/disconnected counts plus total correct/wrong answers,
  and factual positive maximum awards for score, correct answers and best streak
- award ties include every tied participant in final standing order, DISCONNECTED
  participants remain eligible, and the same factual leader may receive all awards
- reads the existing durable Race/RacePlayer model with one player query; no result
  entity/table/cache, migration, Redis truth, live event or gameplay mutation exists
- repeated reads are stable and the service transaction is read-only; existing
  `RaceFinishServiceTest` idempotence coverage remains the completion owner.

### S3-02 — Dashboard active/finished navigation support

**Status:** `DONE (2026-09-20)`

- confirmed that the existing dashboard race `raceId` and `status` are the minimal
  server-owned navigation truth; route selection remains client-owned with
  WAITING_FOR_PLAYERS/READY → room, IN_PROGRESS → live, FINISHED → S3-01 results and
  CANCELLED → no primary action
- added no navigation endpoint, navigation DTO, URL/action field, enum, table or cache
- fixed dashboard `currentPlayers` to count all durable RacePlayer rows with one
  grouped projection query for a non-empty race list; zero-player races default to
  zero, empty dashboards skip the query and repository race ordering is preserved
- fixed `waitingRaces` to include WAITING_FOR_PLAYERS and READY without changing
  `activeRaces = IN_PROGRESS` or `finishedRaces = FINISHED`
- retained the exact `RaceSummaryResponse` field set and the zero-player create-race
  mapping
- corrected the stale architecture claim for a nonexistent
  `GET /api/teacher/races`; the dashboard remains the complete current race-list query
- C4 still owns client route wiring and the Result Screen.

## S4 — Strategic gameplay and effects

The approved flow is NORMAL race, Challenge choice, Turbo Trial or Safe Run, then
NORMAL race. There is one continuous road and one server-owned position model.

### S4-01 — Gameplay/effect foundation

**Status:** `DONE (Checkpoints A and B approved and merged in PR #74)`

Checkpoint A is verified against the baseline above:

- durable one-per-RacePlayer gameplay state with non-null, non-negative
  `challengeEnergy = 0`; new joins create it in the join transaction and legacy
  state is obtained lazily under the caller's existing RacePlayer lock
- explicit persisted `QuestionGameplayContext` NORMAL / TURBO_TRIAL / SAFE_RUN;
  all production questions remain NORMAL, with an entity and DB default for DEV
  `ddl-auto=update` backfill
- durable timed SPEED_SLOW windows with positive additive magnitude in integer
  tenths, source, and half-open `[start, end)` epoch intervals; caller locks the
  RacePlayer before creation, and overlapping speed-effect intervals are rejected
- movement segments reuse the existing exact tick calculator, apply a minimum
  effective speed of 0.1, preserve exact finish crossings and leave earned base
  speed intact while racing; existing terminal finish behavior remains unchanged
- no production slowdown creation, Challenge gameplay, public JSON changes,
  endpoint, live-event type, event-version bump or Redis gameplay truth
- focused tests: 64 run, zero failures/errors/skips; clean full server suite:
  801 run, zero failures/errors, two existing environment-gated tests skipped.

Checkpoint B adds the shared student runtime contract on the current S4 branch:

- non-null `snapshot.gameplay` with exactly `mode`, `effectiveSpeed`, and
  `activeEffects`; production mode remains NORMAL, with stable future vocabulary
  CHALLENGE_CHOICE / TURBO_TRIAL / SAFE_RUN
- `snapshot.speed` remains earned base speed; effective speed at the snapshot epoch
  reuses the tenths-based slowdown calculation and drives `movementUnitsPerSecond`
- each active effect exposes only effectId, type, source, magnitudeTenths,
  startsAtEpochMs and endsAtEpochMs; activity uses half-open intervals and
  terminal/non-moving statuses return zero effective rate and an empty list
- a focused projection service resolves gameplay before the repository-free DTO
  mapper; race-state, answer and finish arbitration share the same runtime shape
- opponent positions and ranks use the same segmented movement calculator;
  one batch effect query for at most eight player ids covers their relevant window,
  with grouping by player id and no per-opponent effect query
- opponent movement rates use effective speed, preserving zero rates at stale
  presence/question cutoffs and projected finishes; arbitration retains settled
  positions while resolving current or stale effective rates
- question responses add `gameplayContext` from the persisted question, without
  special question generation, Challenge entities/endpoints, client changes,
  production effect creation or new SSE/live-event types.

The Checkpoint B contract and client handoff are reviewed and approved for C5
consumption. S4-01 is COMPLETE on main through PR #74.
DEV MySQL startup/schema update succeeded during the separate Checkpoint A check;
that database contained zero player_questions, so existing-row backfill was not
observed. Production migrations remain Phase 6 work.

### S4-02 — Challenge Energy + offer + choice

**Status:** `MERGED with S4-03 (PR #77, main@6808d16)`

Integration branch: `feature/s4-02-03-challenge-flow`. S4-02 must not be merged to
main alone; S4-03 must first implement the selected Turbo Trial / Safe Run flow.

- correct NORMAL EASY/MEDIUM/HARD answers earn 20/25/30 Challenge Energy, bounded
  to 0..100 in application validation and the DB check; wrong answers, timeouts,
  special contexts and terminal players earn nothing
- authoritative post-answer eligibility requires RACING / IN_PROGRESS, Energy 100,
  no unresolved ACTIVE/SELECTED Challenge and position strictly below 80% of total
  distance; an ineligible near-finish player keeps Energy 100
- one durable `RacePlayerChallengeOffer` lifecycle retains ACTIVE / SELECTED /
  EXPIRED / CANCELLED history under the existing RacePlayer lock; offer creation
  consumes Energy to 0 and sets the exact half-open 12,000 ms interval
- expiry resolves at the exact deadline, restores Energy to 50 and creates the
  S4-01 SPEED_SLOW / CHALLENGE_TIMEOUT effect, magnitude 1 tenth, for exactly 4,000 ms;
  movement settles to expiry before effect creation, then to the trusted cutoff
- offer wall-clock expiry continues while offline; reconnect preserves its original
  effect interval, grants no offline catch-up and never shifts a spent penalty
- terminal cleanup cancels ACTIVE offers without Energy restore or slowdown;
  finish crossings before expiry retain their exact finish time
- cookie-owned `POST /api/race-players/me/challenge/choice` accepts offerId and
  TURBO_TRIAL / SAFE_RUN, persists a server decision epoch and returns the shared
  runtime snapshot; same-choice SELECTED replay preserves its original selected epoch
  even after player/race finish and returns a fresh terminal NORMAL snapshot with
  zero movement, no offer and no active effects; conflicting replay still rejects
  with 3036 after finish, while ACTIVE terminal offers are cancelled rather than selected
- exact errors 3033..3037: CHALLENGE_OFFER_NOT_FOUND, CHALLENGE_CHOICE_REQUIRED,
  CHALLENGE_OFFER_EXPIRED, CHALLENGE_CHOICE_CONFLICT, INVALID_CHALLENGE_CHOICE
- `gameplay.challenge` always exposes energy / threshold / offer; ACTIVE offer
  exposes only offerId / expiresAtEpochMs / choices in TURBO_TRIAL, SAFE_RUN order;
  selected state persists the corresponding mode with offer null
- current-question first settles the timeline, then blocks ACTIVE Challenge choice
  and selected special modes from NORMAL generation; S4-03 owns special delivery
- MySQL remains durable truth; caller transactions and RacePlayer → Race lock order
  remain authoritative, with no new Challenge live-event/SSE type or Redis truth.

S4-02 itself excludes Turbo/Safe execution; the local S4-03 implementation below supplies it.
Luck, Power-Ups and Recovery remain unimplemented. One continuous road/world is preserved.

Verification (2026-10-05): focused 147 tests, zero failures/errors/skips; full server
917 tests, zero failures/errors, two existing MySQL tests skipped because
`QUIZWHEELZ_C2_MYSQL_TEST_URL` is not defined. DEV MySQL startup/schema verification
PASS: invalid Energy rows before alignment were 0; challenge_energy remains
INT NOT NULL DEFAULT 0. Hibernate ddl-auto=update did not strengthen the pre-existing
S4-01 CHECK, so an explicitly authorized DEV-only manual alignment replaced >=0
with an enforced 0..100 CHECK. The offer table remains InnoDB with its expected
lifecycle CHECK and player/status index unchanged. Application startup passed
without schema errors, and overall/application, MySQL and Redis health were UP.
H2 persistence, constraints, rollback and concurrent answer/choice/expiry tests passed.
Production migrations remain Phase 6 work. S4-02 is still held from main until S4-03;
S4-03 is implemented locally / under review as recorded below.

### S4-03 — Turbo Trial + Safe Run

**Status:** `MERGED (PR #77, main@6808d16); template-safety bug fix below, not merged yet`

Local baseline: S4-02 commit `75bcc5e288217fb898ceb70fe9492c22aa46271a` on
`feature/s4-02-03-challenge-flow`. The combined Challenge flow is implemented locally;
DEV startup/schema/health verification passed; Diana review remains a gate before PR/main integration.

- both ACTIVE EASY and HARD templates for the race subject are required before an
  offer consumes Energy; absence preserves Energy 100 and exposes neither choice
- special questions use the existing current-question/answer endpoints, template
  planner, Math generator and choice generation; each is durably linked to its
  selected offer and receives a 15-second persistence override without changing templates
- Turbo is exactly one HARD question: correct +80 progress/+40 score, wrong/timeout
  0/0 with SPEED_SLOW / TURBO_FAILURE, magnitude 2 tenths, for exactly 4,000 ms
- Safe is exactly three EASY questions: each correct +15/+8; wrong/timeout 0/0 and
  no penalty; three correct adds +10/+6, totaling +55/+30 with SAFE_PERFECT,
  otherwise SAFE_COMPLETE; the next current-question request owns next-question creation
- special resolutions preserve normal difficulty, streak, learning counters,
  Challenge Energy and earned/base speed; ordinary finish still owns terminal speed
- execution counters, outcome and end epoch live on RacePlayerChallengeOffer;
  statuses remain ACTIVE / SELECTED / EXPIRED / CANCELLED; completion/abort retains SELECTED
- timeout uses exact persisted question expiry, settles trusted movement before
  consequence and then after, never awards offline catch-up or shifts effect intervals
- movement/terminal abort expires special questions without consequence or false
  result; completed reward outcomes are persisted before existing finish logic runs
- original selected-choice replay remains idempotent through execution, completion,
  abort and finish; different replay choice remains 3036; corruption uses new 3038
- exact challenge snapshot fields are energy / threshold / offer / run / lastResult;
  running execution exposes counters/type, latest completed result survives later
  normal answers, reconnect, refresh and finish; a later abort does not erase history
- terminal snapshots stay NORMAL with zero effective speed/movement and no active
  offer/run/effects; completed history remains available
- RacePlayer-first locks, existing Race mutation tracking, live event vocabulary and
  authoritative movementUnitsPerSecond remain unchanged; no physical road branching,
  generic event bus, positive boost, client code or client documentation was added

Verification (2026-10-08): focused 222 tests, failures 0, errors 0, skips 0;
full server 988 tests, failures 0, errors 0, skips 2 (existing MySQL arbitration
cases require QUIZWHEELZ_C2_MYSQL_TEST_URL). Both final runs BUILD SUCCESS.
Java/static gates passed: 51 touched/new Java files, maximum 412 lines, no
comments/Javadocs/TODO/FIXME, and git diff --check PASS.
S4-03 DEV startup/schema verification PASS after explicit authorization and DEV-only
addition of chk_challenge_execution_counters, chk_challenge_execution_state and
chk_player_question_challenge_context. All three prechecks were 0 and all three
CHECKs are ENFORCED with the entity predicates; existing Energy 0..100, columns,
FK/indexes and InnoDB were preserved. Application/MySQL/Redis health passed and
the temporary application was stopped. This final offer gate needs no schema change.
The approved non-overlap prevention rule is now locked: any active SPEED_SLOW at
startsAtEpochMs <= decisionEpochMs < endsAtEpochMs suppresses a new Challenge offer,
retaining Energy 100. Future/expired effects do not block; expiry/refresh/reconnect
never create an offer automatically. The next qualifying NORMAL correct answer
may create an offer if all existing gates pass. Effects remain unchanged and the
SPEED_EFFECT_OVERLAP defensive invariant remains; no stacking or cooldown was added.
Energy 100 does not guarantee an offer; offer existence remains server-authoritative.
Production migrations remain Phase 6; S4-04 / S4-05 / S4-06 remain PLANNED.

#### Challenge question selection - 2026-10-24

**Status:** `MERGED (PR #80, main@9a41ce7); rules and rewards unchanged`

An audit of questions generated from the seeded catalog on main showed every Turbo
question came from the first HARD template (two-number addition 2-12, e.g. "4 + 2"):
the planner indexed the HARD list by questionsResolved, which is always 0 for the single
Turbo question. Every third Safe question was EASY multiplication up to 10x10.
QuestionGenerationService.generate(plan) also re-selected a template by
subject/type/difficulty/pattern, so a challenge could receive a template other than the
one it chose. Product decision (Shimon, 2026-10-24), owned by ChallengeExecutionRules:
Turbo draws only HARD ADD_THEN_MULTIPLY, ADD_MULTIPLY_SUBTRACT,
PARENTHESES_SUM_THEN_MULTIPLY, MULTIPLY_BY_PARENTHESES_SUM or SMALL_MULTIPLICATION_CHAIN
templates (small numbers, several steps; the two-digit chains are built for 50 seconds
and stay out of the 15-second Turbo); Safe draws only EASY ADDITION or SUBTRACTION
BINARY_OPERATION templates. ChallengeQuestionPlanService selects
candidates[(offerId + questionsResolved) mod n], stable for one offer and question, and
owns the filter ChallengeQuestionAvailabilityService uses: this supersedes the first
bullet above, so an offer needs an approved Turbo and an approved Safe template.
ChallengeQuestionDeliveryService generates from exactly the selected template through
QuestionGenerationService.generateFromTemplate, validated by the shared
QuestionTemplateSelectionService.validateTemplateConfig; generate(plan) delegates to the
same path. NORMAL questions, the 15-second limit, scoring, rewards and seeds are
unchanged. Audit after the fix: 50 Turbo offers split 10/10/10/10/10 over the five
templates and 90 Safe questions alternate addition and subtraction. Live check on the
packaged server, two 8-bot races (Luck OFF, and Luck ON with a declared budget): 40 Turbo
and 120 Safe questions, all from the approved templates with the 15-second limit, and 0
server errors.

#### Challenge template safety - 2026-10-24/25 (S4-03 bug fix)

**Status:** `FIXED (prevention + recovery + NORMAL fallback); MERGED (PR #81, main@5ed8a39); for Diana's review`

This is a bug fix inside S4-03, not S4-05 Hidden Recovery. Rules, rewards, timings, the API,
the schema and the offer state machine are unchanged.

What broke (each case reproduced by a test that failed before the fix):

- An offer spends Energy 100 when it is created, but the candidate filter checked only
  difficulty, pattern and Safe type. A malformed active template (for example minValue above
  maxValue) made a Challenge available and then failed inside generateFromTemplate.
- When every template of the chosen side became unusable after the choice, the run stayed
  SELECTED without a question: every question/current answered
  QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER, the student stayed in TURBO_TRIAL or SAFE_RUN and
  the Energy was gone.
- A template that passes validateTemplateConfig but fails in the generator (the operator range
  checks in MathQuestionPlanValidator, or QUESTION_GENERATION_FAILED) was worse: the read-only
  @Transactional generator marked the whole request rollback-only, so the answer became a 500
  (UnexpectedRollbackException) and nothing the request did was saved. The NORMAL path had
  the same defect: a NORMAL question that could not be built became a 500.
- NORMAL never skipped a broken template: the template whose turn it was (questions generated so
  far modulo the active templates) failed the player's question, with no fallback. And
  QuestionGenerationService.generate(QuestionPlan) chose the template again by its fields (the
  first active one with the same type, difficulty and pattern), so a look-alike template could
  replace the one whose turn it was.

Shared fallback: QuestionTemplateFallbackService (service/question) holds the one template loop
and the one template-error filter, and both NORMAL and Challenge use it.
generateFromFirstUsable(templates) generates straight from each template in the given order
through QuestionGenerationService.generateFromTemplate (validateTemplateConfig plus the real
generator), each template at most once, and returns the first question. Only
INVALID_QUESTION_TEMPLATE_CONFIG, QUESTION_TYPE_NOT_SUPPORTED and QUESTION_GENERATION_FAILED
move to the next template; database, timeout, programming and every other error propagate.
hasValidConfig(template) is the same filter around validateTemplateConfig. A skipped template
is logged at DEBUG only.

Prevention: ChallengeQuestionPlanService drops every candidate that
QuestionTemplateSelectionService.validateTemplateConfig rejects (the one validator the generator
already uses; no new validator). Validation runs before the Turbo/Safe approval, so a template
without a type or pattern is skipped instead of failing the approval check. Availability needs,
for both Turbo and Safe, a valid template that QuestionGenerationService.generateFromTemplate can
actually turn into a question (the generator is the only complete judge: a template can pass the
config check and still fail its operator ranges). This dry run happens only when a player is
eligible for an offer, so it is rare, and it stops after the first template that works. A broken
side keeps Energy and makes no offer. Without the dry run, a template that can never generate
was offered again after every correct answer once the recovery had refunded the Energy (proven
by a test). A database or timeout failure is never read as "no template".

Recovery: ChallengeQuestionPlanService.generateQuestion hands the valid templates of the choice,
in turn (the stable (offerId + questionsResolved) selection first), to the shared fallback.
When no template produces a question,
ChallengeQuestionDeliveryService.resolve calls ChallengeOfferService.endUndeliverableRun, which ends
the run with ChallengeExecutionStateService.abort
(executionEndedAtEpochMs set, outcome null: no Turbo/Safe result, reward or penalty, and Safe
answers already given keep their rewards) and restores the Energy to ENERGY_THRESHOLD. The
refund happens only when abort reports that it ended an open run, under the RacePlayer lock
that getOrCreateCurrentQuestion already holds, so a retry, a refresh or a concurrent request
can never refund twice. The same request then continues with a NORMAL question. No offer is
created there (offers still come only from a correct NORMAL answer, and availability stays false
while a side is broken). A finished or non-racing player never reaches this path: the request
guard's terminal cancel ends such a run first, without a refund. A short "why" comment sits at
the recovery in ChallengeQuestionDeliveryService.resolve, and every technical abort logs one
warning with the offer, the race player and the choice, so a broken catalog stays visible to
operators.

NORMAL fallback: RacePlayerQuestionPlanService.templatesInTurn (it replaces buildQuestionPlan)
returns the active templates of the race subject at the player's current difficulty, rotated so
that the template the existing fair turn picks comes first and the others follow once in
catalog order. StudentQuestionDeliveryService gives that list to the shared fallback and persists
the first generated question once; nothing is written before a template succeeds. The subject,
difficulty, adaptive mode, assistance level, choices count and time limit still come from the
player and the template that produced the question: there is no switch to another difficulty or
subject. When no template works, the student gets QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER
(409, the same code as "no active template") instead of a template error code or a 500, nothing
is created, and one warning names the race player and the difficulty. The same request still
keeps a technical abort and its refund. Once a template is repaired, the next request succeeds
with no cleanup. A short "why" comment sits in StudentQuestionDeliveryService.

Transactions: RacePlayerQuestionPlanService.templatesInTurn,
QuestionGenerationService.generateFromTemplate and
PlayerQuestionPersistenceService.persistGeneratedQuestion now declare noRollbackFor =
ApiException. Their ApiExceptions are validation outcomes (persistence checks everything
before its single save), so they no longer veto the commit that getOrCreateCurrentQuestion
already declares for ApiException. Without this, the recovery and the NORMAL fallback were
rolled back (proven by the tests). Effect: a question that cannot be built reaches the student
as its own error code instead of a 500, and the request's other changes (movement settlement,
live events, a recovery) are kept. Infrastructure failures still roll back everything, so
nothing is half-saved and the next request retries cleanly.

Energy decision (Shimon, 2026-10-25): a one-time full refund to the threshold, because the fault
is the system's and not the student's.

Tests: ChallengeQuestionPlanServiceTest (turn order, malformed templates, availability by
generation, first template in turn that generates, unrelated failures never read as a template);
S4ExecutionDeliveryTest (prevention; a database failure or an unrelated error is not recovered;
a rejected NORMAL question after the abort keeps the abort and the refund); S4ChallengeRecoveryTest
with the real question services (stuck Turbo run, generator failure on a validated template,
healthy alternative, NORMAL failure after the abort, Safe run cut short after a correct answer,
two concurrent requests, finished race, templates that never generate make no offer, no renewed
offer for a malformed or a never-generating side, NORMAL failure regression, an ended run
falling back past a broken NORMAL template), run on H2
and on MySQL through S4ChallengeRecoveryMySqlTest. NormalQuestionFallbackTest with the real
question services (broken template in turn gives way within the same subject and level, healthy
templates keep their fair turn, the question comes from the template in turn even next to a
look-alike, a validated template the generator rejects gives way, every template broken ends in
QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER with no state change and no borrowing from another
level or subject and works again after repair, generator-only failures end in the same code
instead of a 500, two parallel requests share one question, refresh returns the same question),
run on H2 and on MySQL through NormalQuestionFallbackMySqlTest. StudentQuestionDeliveryGenerationTest
proves that a database or unrelated failure on the first template propagates, the next
template is never tried and nothing is persisted. The S4 test fixtures share one
S4ChallengeFlowFixture, so the mocked and the real-service suites use the same helpers.

Verified 2026-10-25 on the branch: the full H2 suite (1,338 tests, 85 of them MySQL-only and
skipped there), all fourteen MySQL classes in one run on a disposable MySQL 8.4 (198 tests),
the live HTTP check against the packaged server (14/14), and a two-student run in a real
browser (headless Chrome, 36/36): the student who chose Turbo sees an answerable NORMAL
question about 1.3 s after the templates break and the same question after a reload; Safe cut
short after one correct answer keeps that answer and shows no Safe result; with 10 of 11
templates of the player's level broken the next NORMAL question comes from the healthy one;
healthy Turbo and Safe behave as before; a recovery on a slow network with a 1.5 s disconnect
still ends once with one NORMAL question. No HTTP 5xx and no page errors.

Follow-up for Diana (not part of this fix): QuestionGenerationService.generate(QuestionPlan)
and the three QuestionTemplateSelectionService.selectTemplate overloads no longer have a
production caller (only their own unit tests). They are left unchanged; remove them or keep
them as you prefer.
2026-10-25 (S4-05 package): the four methods are now marked `@Deprecated` with a one-line
reason (choosing by fields can return a look-alike of the template whose turn it is), so new
code does not pick them up. Plain `@Deprecated`, not `forRemoval`: removal stays your call, and
a removal warning would also fire inside the deprecated `generate` and in every test that calls
them. `generateFromTemplate` and `validateTemplateConfig` are in use and unchanged.

### S4-04 - Power-Ups + fair Luck

**Status:** `A/B1/B2/C1/C2 on main (PR #79); 2026-10-24 stability fixes on main (PR #80, main@9a41ce7); rollout OFF`

The checkpoint statuses below record each review gate as it stood at the time; every
checkpoint reached main with PR #79, and the post-merge stability fixes with PR #80.

Local checkpoint, 2026-10-18, `feature/s4-04-fair-luck`, based on
`origin/main@84a44230b77f6acb469c6f969070e4c0cf409325`. Approved V5 parameters
supersede older Power-Up/Luck proposals. This is not a playable feature.
The foundation description below records the approved A baseline; the later B1
and B2 sections supersede its integration/read-strategy status.

- Gameplay state declares Shield charges/granted/award question, Luck attempt
  and tangible-event counts, cooldown, sequences, recent manual activity and the
  negative guard, with Java/DB defaults and bounded CHECK constraints.
- RaceLuckFairnessState models one unique state per Race. RacePlayerLuckDecision
  stores each actual attempt, unique per player/source question, with selected
  and applied types, outcome, effective magnitude/energy delta, effect link and
  ordered-read indexes. Deferral stores no attempt or cooldown.
- Detached policies cover third cumulative correct NORMAL answer Shield,
  eligibility, weighted injected RNG, anti-Mud, Orb fallback/capping and cooldown.
  Fairness uses the race's last event sequence as the opportunity boundary.
  The 60-second activity window remains provisional; pure tests compare 30/60/90.
- FairLuckService requires caller-held PESSIMISTIC_WRITE locks on its managed
  RacePlayer and Race and an owned, managed, ANSWERED NORMAL question with an
  explicit first-accepted manual-answer signal. It is not connected to answers.
  It lazily initializes per-race state, guards duplicate source attempts, grants
  Shield, checks eligibility/fairness and atomically persists RNG outcomes,
  counters, cooldown, sequence, recipient, Orb energy, Shield consumption and
  speed-effect records. It never changes learning score/difficulty/progress.
- GuardShieldService obtains fresh own state and grants once at correct count 3.
  LuckEffectResolver reuses the existing speed-effect owner; that owner now has
  an additive boost-persistence method sharing its no-overlap invariant. The
  movement calculator still has no BOOST integration: that remains Checkpoint B.

Lock/isolation proof: submitAnswer remains findLockedRacePlayer ->
RaceLiveMutationTracker.begin -> RaceLiveMutationGate -> Race lock. New owners
validate those locks rather than acquiring player/Race locks in reverse order.
Own gameplay state, own audit and per-race state use current locking reads;
managed state is refreshed before use. Own unresolved Challenge and speed-window
queries use current SELECT ... FOR UPDATE restricted to the caller's player ID.
No peer RacePlayer lock is acquired. Future speed-window overlap is checked using
an own current read before effect creation; errors roll back the entire attempt.

LuckPeerReader suspends the caller using a focused REQUIRES_NEW, read-only,
READ_COMMITTED transaction. One JDBC projection reads committed peer state with
RACING/IN_PROGRESS, <80%, cap, cooldown, recent manual activity, unresolved
Challenge and all-source active speed-effect exclusions. It does not request row
locks and bypasses the caller's Hibernate identity map and old consistent-read
snapshot. The outer transaction retains Race throughout; other active gameplay
writers still serialize through that Race lock. The connection pool must provide
an additional connection for this short read; 8 concurrent callers passed with
the existing default pool. Global answer isolation is unchanged.

Real MySQL validation uses only disposable mysql:8.4 (server 8.4.11), tmpfs at
/var/lib/mysql, localhost-only port 13317, database quizwheelz_s4_luck_test.
LuckMySqlTest is gated by QUIZWHEELZ_LUCK_MYSQL_TEST_URL/USER/PASSWORD; URL must
match jdbc:mysql://127.0.0.1:<port>/quizwheelz_s4_luck_test. It asserts MySQL and
REPEATABLE_READ, pins an old snapshot, observes an actual InnoDB data_lock_waits
entry while player A holds its own lock and waits for Race, commits B's Luck
state, then proves A's ordinary read remains stale while LuckPeerReader sees the
commit. Further tests cover 2/4/8 simultaneous players, equal decision timestamps,
sequential durable audits, duplicate source requests with old snapshots and
rollback/constraints/peer exclusions on actual MySQL as well as H2.

No answer/timeout, Challenge behavior, movement calculation, API, SSE or client
integration is included. No local DEV/production DB or production DDL was used.
Final commands, counts, failure history, complete patch and git evidence are in
server/target/checkpoint-a-review.md and the adjacent logs (local review artifacts).
Checkpoint B, commit, push and PR await explicit user approval.

Final review, 2026-10-18: Checkpoint A is approved as a detached local foundation.
Before this documentation-only update, the working tree exactly matched the
reviewed 27-file patch (SHA-256
`4abd6c7966d9f4a494d1ba4f9fefc8cbed619afdd31b9965d5a2a8ea220b41ec`).
Final focused tests: 113 passed, zero failures/errors/skips. Final full suite:
1,089 run, 1,087 passed, zero failures/errors, two existing C2 MySQL skips.
LuckMySqlTest passed all 38 tests in both runs. The visibility blocker is resolved
in the tested scenario; S4-04 is not playable and B is not automatically approved.

#### Mandatory gates before enabling Checkpoint B

1. **B-GATE-1 - Connection-pool headroom across concurrent races:** reproduce
   multiple simultaneous races against disposable real MySQL with a deliberately
   small Hikari pool. Outer transactions retain both connections and Race locks
   while REQUIRES_NEW readers request additional connections. Capture starvation
   or timeout behavior when outer transactions fill the pool, select an enforceable
   resource strategy, and verify it before enabling Luck. Eight players per race
   do not bound global concurrency. Do not substitute a speculative global
   isolation change or peer RacePlayer locks.
2. **B-GATE-2 - Managed state refresh and Challenge Energy:** prove that
   GuardShieldService's EntityManager.refresh cannot discard pending correct-answer
   Energy, offer consumption/reset, Orb or Shield changes when integrated with
   ChallengeOfferService.afterAnswer. Verify all changes survive the same
   transaction and appear in the returned snapshot. This is a potential integration
   hazard, not a demonstrated A failure.
3. **B-GATE-3 - End-to-end answer authority:** integrate only through the existing
   first-accepted manual NORMAL answer after authoritative answer impact. Prove
   timeout, replay, Challenge, >=80%, disconnect/reconnect and successful finish
   cannot create duplicate Luck or an invalid Shield. Test a Shield-awarding answer
   that suppresses Luck on the same source question.
4. **B-GATE-4 - Movement and existing event contracts:** prove Tailwind stays <=2.0
   in every movement segment and finish-crossing calculation. Cover Mud versus
   Turbo slowdown overlap, expiry, snapshots and QUESTION_ANSWERED refresh. Schema
   and effect persistence alone do not establish active client/movement behavior.

**Deployment gate:** production uses ddl-auto=validate. New columns and tables
require an explicitly approved schema deployment/migration path before rollout;
this is not authorization to execute DEV or production DDL.

**Test-log qualification:** the initially empty disposable MySQL schema emitted
Hibernate GenerationTarget warnings when DROP foreign-key statements referenced
tables that did not yet exist. Tests passed, but startup DDL output was not clean.
Two earlier rollback-only test errors were corrected before the final green runs.

A local A commit requires Diana's explicit go-ahead. Push, PR and merge require
further approval. Preserve approved probabilities, thresholds and effect sizes;
do not expand scope or start B based solely on the A review.

#### Checkpoint B1 - accepted NORMAL answer integration

**Status:** `B1 implemented/verified, pending Diana review; rollout OFF; see second unblock validation below`

The first-attempt blocker evidence below is historical. The latest measured status
is recorded in the second scoped unblock validation section.

Local baseline is approved A commit `466f041b85e59889a552e1500ccdcc5051274dd6`.
The single new call is after ChallengeOfferService.afterAnswer and before
QUESTION_ANSWERED/live mutation tracking/snapshot in StudentAnswerSubmissionService.
It is reached only after a validated ACTIVE -> ANSWERED manual NORMAL answer.
AcceptedAnswerLuckService delegates exactly once to the A owner, without a second
Shield call or clock. Terminal results return without entering Luck.

Rollout property: `QUIZWHEELZ_LUCK_ANSWER_ENABLED`, default **false** in the
injection expression. No runtime profile enables it. Only dedicated B1 tests
set it true. OFF performs no Luck provider lookup, flush, RNG or Shield/Luck
writes; normal Challenge/answer behavior and response shape remain unchanged.
Do not enable it for normal DEV/production gameplay or start B2.

B-GATE-2 is covered by actual answer-service/JPA tests under H2 and MySQL:
normal Energy gain survives, threshold Offer/reset persists, correct/wrong Orb
increments survive and cap at 100 without creating an Offer in the same answer,
and third-correct Shield can coexist with an Offer/reset. The integration flushes
the accepted answer/Challenge changes before A's state refresh. Hibernate may
report a dirty, flushed entity's write lock as PESSIMISTIC_FORCE_INCREMENT; the
A guard now accepts that existing stronger write mode as well as PESSIMISTIC_WRITE.
It does not request a stronger lock or admit read/unlocked entities.

StudentAnswerSubmissionService keeps noRollbackFor=ApiException. The integration
wraps internal Luck ApiException failures in IllegalStateException, so an internal
overlap/invariant failure cannot use the entry point's unrelated API-error
exception to commit half an answer. Tests inject infrastructure, real constraint,
overlap and post-Shield/Offer event failures and verify complete DB rollback.
The pre-existing terminal-race nested-engine rollback-only exception remains
unchanged; explicit OFF/ON tests characterize UnexpectedRollbackException there.

ChallengeOfferService now suppresses new offers for both active SPEED_SLOW and
SPEED_BOOST with existing [start,end) queries, preserving Energy 100. There is no
new movement, DTO, SSE, client, timeout or schema integration.

**B-GATE-1 remains BLOCKED with measured evidence:**

- In disposable MySQL 8.4.11 / REPEATABLE_READ, two actual answer transactions
  in two distinct races fill a Hikari pool configured to maximum/minimum size 2
  with 1,500 ms acquisition timeout. A latch at the existing own-effect query
  ensures both outer connections are held; the test observes two queued nested
  connection requests. The unchanged REQUIRES_NEW readers time out. Failed
  transactions leave no partial answer, score, Energy or Luck audit/counter.
  Fairness rows are preinitialized only in this steady-state test to isolate pool
  behavior. This is a failure-characterization test, not runtime approval.
- An initial unprimed two-race answer test also exposed InnoDB error 1213: the
  unique race_id index in race_luck_fairness_states has conflicting gap locks
  from findLockedByRaceId followed by lazy INSERT. SHOW ENGINE INNODB STATUS was
  captured. A separate bounded test reproduces the issue through the real answer
  service after coordinating the missing-row locking reads and checks loser
  rollback. The approved initialization algorithm has not been redesigned.
- Runtime-safe resource ownership/admission and atomic missing-row initialization
  require a reviewed decision. Options include a separately budgeted read pool
  or admission before outer JDBC acquisition, plus an approved initialization
  strategy that avoids competing missing-row gap locks. No global isolation
  change, peer RacePlayer lock, unspecified pool enlargement or automatic retry
  was introduced. The feature stays OFF pending approval and revalidation.

Single-race actual answer tests cover 2/4/8 students and duplicate same-question
submissions. A's stale-snapshot and 2/4/8-player tests are retained. Exclusion
coverage includes manual correct/wrong, timeout, STRICT focus forfeit, refresh,
reconnect, rejected/replayed answers, Challenge choices, post-answer 80% and
finish, active effects, cooldown, cap and Shield-blocked Mud. Final counts,
commands, complete failure history and patch are local review artifacts under
server/target/b1-*; do not infer readiness from passing characterization tests.

B2 movement/client/snapshot contracts and the explicit production migration gate
remain open. No commit, push, PR, merge, DEV/production DDL or B2 is authorized.

#### Scoped B1 unblock attempt - 2026-10-19

**Status:** `B1 PARTIAL - BLOCKED: cross-race luck-audit gap deadlock; candidate not approved`

The 19-file B1 worktree was verified byte-for-byte against its submitted patch
before this attempt. The existing accepted-answer hook, default-OFF gate, gameplay
rules, Challenge coordination and rollback wrapper were preserved. Nothing was
staged or committed. The preceding blocker report remains historical evidence;
this section describes the stopped candidate at that review.

The approved preferred approaches were implemented as candidates:

- LuckPeerJdbcResources privately owns a lazy, bounded Hikari pool against the
  primary datasource's exact JDBC URL/properties/credentials. It is not a second
  DataSource bean or transaction manager. LuckPeerReader uses an explicit raw
  JDBC connection in auto-commit READ_COMMITTED, one nonlocking peer projection
  and try-with-resources, bypassing Spring's outer transaction-bound connection
  and Hibernate persistence context. REQUIRES_NEW on the writer manager is gone.
- Pool maximum/acquisition timeout/query timeout have explicit configuration keys:
  QUIZWHEELZ_LUCK_PEER_POOL_MAX_SIZE (default 2),
  QUIZWHEELZ_LUCK_PEER_ACQUIRE_TIMEOUT_MS (default 2000), and
  QUIZWHEELZ_LUCK_PEER_QUERY_TIMEOUT_SECONDS (default 2). No peer pool is created
  until a read. Shutdown has an explicit PreDestroy close owner. Lifecycle,
  failure-path release and resource-budget rejection tests remain unfinished
  because the required cross-race acceptance failed and triggered the stop rule.
- A read requires explicit positive deployment settings:
  QUIZWHEELZ_DB_MAX_APPLICATION_INSTANCES,
  QUIZWHEELZ_DB_APPLICATION_CONNECTION_BUDGET,
  QUIZWHEELZ_DB_RESERVED_CONNECTIONS. Their runtime defaults are zero (fail closed
  on a read, while OFF does not initialize the pool). The candidate checks
  instances * (primary maximum + peer maximum) <= application budget and, on
  MySQL, application budget + reserved <= @@max_connections. Deployment must
  enforce the declared instance maximum; these checks are not a scale proof.
  The test profile alone supplies 1 instance / 64 application / 10 reserved.
- RaceLuckFairnessStateService validates existing player/Race locks, performs a
  native INSERT ... ON DUPLICATE KEY UPDATE race_id = race_id, then locks and
  refreshes the now-existing row. It does not reset counters/recipient/history.
  FairLuckService and the A sequence test use this owner; no production caller
  performs the former missing-row locking read before this insert.

The first real MySQL run passed A's 38 tests including stale-snapshot visibility
and same-race 2/4/8-player ordering. In the original primary-pool-size-2 test, the
assertions verified one primary DataSource bean, the existing JpaTransactionManager
and its primary datasource, two active writers with no primary waiters, and one
active / one queued read on a separate peer pool capped at 1. However, BOTH
cross-race answer tests FAILED later at race_player_luck_decisions INSERT.

InnoDB now identifies index uk_luck_player_question in race_player_luck_decisions:
findLockedBySource searches absent audit rows with FOR UPDATE, taking shared-gap
exclusive locks before concurrent inserts for distinct players/races. The native
fairness upsert no longer appears as the failing INSERT in these traces, but the
complete answer path is still unsafe. The tests now require both commits and
remain RED; no characterization assertion was weakened to hide the issue.

Per the directive's stop condition, no audit/duplicate-source redesign, new
schema, retry, global isolation change, peer RacePlayer lock, pool enlargement
or alternative architecture was implemented after this discovery. Review options:

1. A nonlocking committed audit lookup using the independent primary reader,
   combined with an explicit outer-transaction pending/own-write guard and the
   existing player/question serialization and UNIQUE defense. It must prove
   duplicate-source behavior for old snapshots, repeated calls in one transaction,
   concurrent requests and rollback before adoption.
2. A durable decision reference/claim owned by the already-locked PlayerQuestion,
   if a schema expansion is explicitly approved; it needs its own lifecycle and
   migration review. No new audit outcomes or placeholders have been introduced.
3. If the candidate fairness upsert is not retained, the directive's fallback is
   eager fairness-row creation at race creation/start plus an approved idempotent
   backfill before activation. This is not implemented and would not by itself
   solve the separate audit-table gap locks.

Focused regression also exposed H2 compatibility work: DataJpaTest replacement
creates H2 databases without MySQL mode, so the MySQL upsert syntax is rejected
in those fixtures despite the configured test-profile URL. No H2 success is
claimed. An explicit test-only dialect/mode setup or reviewed portable initializer
is still needed; production initialization was not replaced with an unproven
fallback after the stop.

Final stopped-candidate focused run: 343 executed, 307 passed, 7 failures,
29 errors, zero skips. Full regression: 1,159 executed, 1,121 passed, 7 failures,
29 errors, two existing C2 MySQL skips. Actual MySQL: 70 passed / 2 failed;
A freshness and B1 Energy/rollback remain green on MySQL. The remaining failures
are the MySQL cross-race audit deadlock and H2 upsert compatibility. These are
red results, not a completed checkpoint.

Final stopped-candidate focused/full logs and every failure/stack trace are under
server/target/unblock-*. Cross-race repeated 2/4/8-race load, p95/p99 acceptance,
resource lifecycle/failure-budget tests and a green full suite are NOT established.
Do not label B1 complete or enable QUIZWHEELZ_LUCK_ANSWER_ENABLED. B2 and the
production migration gate remain untouched; no commit/push/PR/merge is authorized.

#### Second scoped B1 unblock validation - 2026-10-19

**Status:** `B1 implemented/verified in the measured envelope; pending Diana review; rollout OFF`

This section supersedes the earlier B1 blocker statuses, while retaining their
failure evidence. No schema or gameplay-policy change was required. The original
B1 accepted-answer integration and the private-reader/fairness-upsert candidates
were preserved; their acceptance remains subject to Diana's review.

- RacePlayerLuckDecisionRepository no longer exposes the missing-source FOR UPDATE
  lookup. LuckDecisionSourceReader explicitly flushes the existing writer, uses a
  nonlocking own-write-aware repository check, and, if absent, a short nonlocking
  READ_COMMITTED lookup through the private JDBC pool against the same primary.
  This accounts for both uncommitted own audits and commits hidden by an old RR
  view. The existing player -> Race locks serialize valid same-source writers;
  UNIQUE(player, source question) remains the final enforcement layer. No audit,
  RNG outcome, effect, counter or event is written through the reader pool.
- Repeated direct calls for an audited source are idempotent no-ops, including
  same-transaction calls and old-view replays after the original cooldown has
  elapsed. Public duplicate requests retain QUESTION_NOT_ACTIVE. The trusted
  first-accepted signal still belongs to the existing ACTIVE -> ANSWERED owner;
  no processed marker or audit is invented for no-roll sources.
- Fairness initialization still performs the atomic no-reset upsert before any
  locking read. Repeated initialization preserves sequence, last-event sequence,
  recipient and existing audit rows on both H2 and MySQL.
- Affected persistence/answer slices opt out of embedded replacement. A test-only
  DynamicPropertyRegistrar gives each H2 context an isolated in-memory URL with
  MODE=MySQL while retaining explicitly configured disposable MySQL URLs. Runtime
  assertions verify JDBC URL, database product, Hibernate dialect, H2 settings and
  MySQL RR isolation. No production dialect fallback or initialization stub exists.
- Reader-resource tests cover concurrent lazy creation, pool bounds, acquisition
  timeout, actual MySQL query timeout, release after SQL exceptions, close and
  PreDestroy, invalid deployment limits and application/server budget rejection.
  OFF performs no acquisition or Luck mutation. Reader failures while ON roll the
  complete accepted answer back. The primary DataSource/JpaTransactionManager
  wiring remains unchanged and is asserted in the original pool-size-2 scenario.
- An actual duplicate-key insert after QUESTION_ANSWERED is recorded proves full
  rollback of question, score, Energy, Shield, audits, counters, fairness state,
  speed effects and durable events/version on H2 and MySQL. Existing rollback,
  Challenge, exclusions, Shield precedence, cooldown and fairness tests remain.

Final focused regression: 388 tests, zero failures/errors/skips. Full regression:
1,204 tests, 1,202 passed, zero failures/errors, two existing RaceArbitrationMySqlTest
skips because its separate C2 MySQL environment is not configured. All 109 Luck
MySQL tests executed and passed, including the strengthened after-cooldown stale
source check in the final full run. Both original cross-race reproducers now
require successful commits and pass; no failure characterization substitutes
for success.

Disposable MySQL 8.4.11, RR writers: ten repetitions for each of 2/4/8 cold distinct
races and 2/4/8 same-race players, in both focused and full regressions. Each run
contains 280 measured successful answers. Full-run p99/worst latency in ms:
separate races 134.321 / 102.613 / 209.851; same race 269.978 / 465.144 / 945.762.
These are service/transaction harness measurements, not network latency or a
production capacity claim. The report includes all samples, p50/p95, timing
boundaries and 1 ms sampled active/idle/waiting peaks. Cross-race writer/read maxima
were 8/2; at eight races observed active peaks were 8/2 and reader waiting peak 4.
The forced original scenario uses writer/read maxima 2/1 and proves 2 active
writers, no writer waiters, one active reader and one waiting reader.

Test deployment declaration: one instance, application connection budget 64,
reserved 10, MySQL max_connections 151. Runtime defaults for undeclared deployment
budgets still fail closed on first read. Final fresh InnoDB metrics report zero
deadlocks and zero lock timeouts; stress cases have zero unexpected errors or
timeouts. Pool sizing remains bounded by the measured envelope, not universally
proven sufficient.

Complete working-tree patch, Hebrew report, exact commands, final Git state,
JUnit XML, failure history, latency/pool evidence and InnoDB diagnostics are local
ignored review artifacts under server/target/second-unblock-*. All changed code
files satisfy the 500-line/no-comment rule and git diff --check passes. The index
is empty and HEAD remains approved A commit 466f041b85e59889a552e1500ccdcc5051274dd6.

QUIZWHEELZ_LUCK_ANSWER_ENABLED remains false by default. B2, movement/client work,
production migration approval, staging, commit, push, PR and merge remain outside
this authorization. Stop for Diana's review.

#### Checkpoint B2 - server runtime, gameplay snapshot and event delivery

**Status:** `B2 SERVER READY FOR REVIEW; rollout OFF; pending Diana review`

Approved B1 was committed locally as 206405d8b36b6e34bc498bc836ca5f7a1ef75967.
The prior B1 review paragraphs are historical evidence. B2 starts from that clean
commit on feature/s4-04-fair-luck and is authorized for server implementation only.

RaceSpeedEffectMovementCalculator now handles persisted BOOST and SLOW through the
same exact tick calculator, sorted half-open windows, base-speed gaps and earliest
finish crossing. Boost clips to MAX 2.0; slowdown retains effective minimum 0.1.
Adjacent mixed effects are supported; corrupt overlapping speed windows fail
closed. With no elapsed time or a reversed interval, the original tick calculator's
anchor is retained.
The insertion-time all-source overlap guard, finish-order bound and learning
rules are unchanged. Own settlement, read-only opponents and gameplay projection
share this calculator without acquiring peer RacePlayer locks.

StudentRaceGameplayResponse additively includes non-null powerUps and luck,
retaining its existing four-argument constructor. Gameplay projection reads own
persisted Shield state and at most two APPLIED/BLOCKED_BY_SHIELD audit outcomes,
ordered ascending by stable audit ID, through a bounded nonlocking repository
query. Historical award IDs survive consumption and finish. NO_EVENT/NO_EFFECT
stay audit-only. Active BOOST/SLOW windows agree with effectiveSpeed and the shared
movementUnitsPerSecond calculation; terminal snapshots retain history with zero
rate and no active effects. Existing Challenge, opponent and teacher fields remain.

No SSE code, event enum, endpoint or cursor change is needed. Real server tests
hold an accepted answer transaction open and verify no signal before commit,
then QUESTION_ANSWERED plus the existing progress signal, matching answer/GET
snapshots, unchanged IDs on late replay/reconnect, and no committed ghost event
on rollback. Client code was inspected read-only: QUESTION_ANSWERED during PLAYING
requests silentRefresh and gaps request resync. Client rendering, new-field mapping,
one-shot deduplication and effect-expiry refresh scheduling remain C5 work.
The exact contract/expiry/ID handoff is in
../00-project/ARCHITECTURE_AND_CONTRACTS.md under S4-04 B2.

Tests include exact start/end/finish/tick partition boundaries, clipped Tailwind,
Mud, adjacent/gapped windows, historical overlap rejection, 2/4/8 participant races
at distances 100/300/1000, own/opponent/standing/finish-arbitration agreement,
awarded/consumed/blocked/finished/empty/two-event serialization, quiet expiry GET,
and existing signal delivery. MySQL subclasses verify the actual MySQL product,
RR isolation and the isolated test URL. A MySQL concurrency proof observes actual
InnoDB player-lock waits while GET/reconnect compete with a pending answer;
heartbeat and all re-reads consume no additional RNG.

Final focused regression after the final code/test change: 1,016 executed,
1,014 passed, zero failures/errors, two existing C2 MySQL skips. Full regression:
1,289 executed, 1,287 passed, zero failures/errors, the same two C2 skips.
All 143 real-MySQL Luck/B2 tests passed (109 preserved A/B1 plus 34 B2).
B2 adds 85 tests including the additive serialization case; its movement,
snapshot and delivery matrix runs on H2 and actual MySQL where applicable.
The blocked-Mud SSE case keeps score/position/speed unchanged at the base-speed
floor and proves that QUESTION_ANSWERED alone provides the refresh opportunity.
The original 2/4/8 cold-cross-race and same-race groups were rerun ten times per
size, 280 measured answer operations per full run. Fresh final MySQL metrics show
zero deadlocks and zero lock timeouts. Load percentiles/pool samples, exact commands,
serialized snapshots and traces, full logs/XML, complete working-tree patch and
Hebrew review are under ignored server/target/b2-*. These remain service/transaction
measurements on disposable MySQL, not an HTTP or production capacity/SLA claim.
No required B2 server gate remains blocked in this measured envelope. Client C5
mapping/expiry refresh/moments and production migrations/budgets remain open gates.
Protected B1 answer/FairLuck/pool/current-read/fairness owners, the low-level tick
calculator and RaceFinishOrderPolicy remain unchanged. Luck generation remains
OFF by default. No client change, schema/migration, staging, commit, push, PR,
merge, deployment, Checkpoint C or feature activation is authorized.

#### Checkpoint C1 - server acceptance QA and PR readiness

**Status:** `C1 SERVER QA READY FOR REVIEW; rollout OFF; pending Diana review`

A, B1 and B2 are approved local commits 466f041, 206405d and ac67bc2. C1 starts
from ac67bc277fd8bcc7de7e86311aefee1f621b5a13 on feature/s4-04-fair-luck.
Those checkpoint implementations are preserved. C1 adds eight focused test files
and this documentation only; production code, client, schema, dependencies and
workflows are unchanged. No staging or Git publication is authorized.

The new acceptance matrix runs actual answer, Challenge, Luck, movement, standing
and snapshot owners for 2/4/8 players, distances 100/300/1000 and seeds 7/41/2026,
each OFF and ON, on H2 and disposable MySQL. Controlled persisted questions and
mocked Redis presence make these service/JPA scenarios, not browser or HTTP E2E.
Further tests prove later manual opportunities after peer NO_EVENT or loss of
eligibility, identical-input educational invariants, full-speed substitutions,
30/60/90-second pure-policy comparisons, mixed concurrent actions at effect expiry
and exact disposable-schema evidence. Existing A/B1/B2 tests are not weakened.

Final focused regression: 491 cases, 489 passed, zero failures/errors, two existing
C2 MySQL skips. All 173 selected real-MySQL cases passed: 143 retained A/B1/B2 and
30 C1. Full Maven verify passed: 1,360 cases, 1,358 passed, zero failures/errors,
the same two existing C2 skips, and successful server JAR packaging. C1 adds 71
cases in total. Both final runs used identical Java source hashes.

The complete deterministic matrix has 126 ON player-races per database and 252
OFF/ON player-race comparisons between H2 and MySQL. Measured gameplay outcomes
match across databases. Per database: 205 attempts, 116 NO_EVENT, 79 APPLIED,
10 BLOCKED_BY_SHIELD, zero NO_EFFECT in this sample and 21 fairness deferrals.
Dedicated answer/policy tests cover NO_EFFECT separately. Six deferral episodes
resume after 8-49 seconds; two reach the finish gate before another draw and are
reported as censored rather than starvation or resumed successes. No equality of
random outcomes or universal waiting bound is claimed. All ON winners in this
sample follow the high-accuracy pattern; one OFF tie becomes a sole ON winner.
Seed reuse and eligibility mean the observed histogram is not an independent
estimate of the approved probabilities. Exact probability boundaries stay tested.

MySQL uses only a new disposable mysql:8.4 / 8.4.11 instance, RR writers and the
unchanged bounded READ_COMMITTED private reader, tmpfs storage and localhost-only
port 13318. Both final regressions retain ten repetitions of each 2/4/8 same-race
and distinct-race group: 280 measured answer transactions per run. Latency and
1ms sampled active/idle/waiting peaks are harness evidence, not an HTTP SLA or
production budget. After both final regressions, InnoDB reports zero deadlocks,
zero lock timeouts and zero maximum-connection errors. Expected create-drop
lifecycle warnings and injected failure proofs remain visible in the logs.

The approved B2 API/SSE contract is unchanged. The local C1 review pack includes
one concise server handoff for Shimon with actual JSON fixtures, persisted event
IDs, version/time ordering and the authoritative expiry-GET contract. Client
mapping, refresh scheduling, React/Pixi/HUD/effects/audio and browser acceptance
belong to Shimon and are not implemented or claimed by this checkpoint.

Read-only readiness inspection finds no GitHub Actions workflow or migration
chain. Local CI parity is not remote CI. Production ddl-auto=validate requires an
approved schema/backfill/deployment plan even while Luck is OFF. Actual target
schema was not accessed. The deployment budget must satisfy sum(W_i+R_i) <= B and
B + reserved <= MySQL max_connections; real instance count, writer pool maxima,
other consumers and reserved headroom remain unconfirmed. Cached test-context
connection peaks are not a production sizing recommendation. The 60-second
activity window remains provisional pending explicit product sign-off; the
30/60/90 comparison does not change its runtime value.

Local main and available origin/main are 84a4423 with 0/3 divergent commits before
C1. No fetch/rebase/merge was run, so current remote compatibility remains a later
review task. The ignored server/target/c1-evidence review pack contains commands,
exit codes, code hashes, logs/XML, fairness/load JSON, schema inventory, patch and
Hebrew report. Future PR-review readiness is separate from merge/deploy/activation
approval. Keep QUIZWHEELZ_LUCK_ANSWER_ENABLED=false and stop for Diana's review;
no client work, C2, staging, commit, push, PR, merge, deployment or migrations.

#### Checkpoint C2 - server integration safety and release gates

**Status:** `LOCAL REHEARSAL COMPLETE; REVIEW PENDING; deployment/activation NOT approved`

A/B1/B2/C1 are approved local commits; C2 starts from C1 commit
733cbb16be508b63ce4fe6a9108923cde9d8ce1b. Earlier checkpoint review/status paragraphs
are historical. This C2 is a server integration-readiness gate, distinct from the
pre-existing optional RaceArbitrationMySqlTest environment gate.

Production/client source, dependencies, actual workflows, gameplay, lock order,
transactions and B2/C1 contracts are unchanged. Review-only proposals and six reports
are in reviews/s4-04-c2/. Generated evidence and the complete patch are ignored under
server/target/c2-evidence. No migration framework or operational policy is adopted.
One existing SSE security test receives a dedicated H2 URL/context; its real
scheduler and all assertions remain. The initial full run had one NoInteractionsWanted
failure from presence calls on shared fixtures. Standalone/paired diagnostics passed;
small slices did not deterministically reproduce it. The supported test-interference
diagnosis and unchanged production SSE path are documented, and original red log/XML
remain as history-full-before-isolation*. Final runs validate the isolated test.
The separate legacy arbitration MySQL gate first failed in shared fixture setup
because the default Luck database guard requires the different Luck schema name.
A test-only verification hook preserves that default and lets the legacy subclass
assert its exact allowed environment URL, schema regex, MySQL product/dialect and
RR isolation. Its original assertions/test bodies remain. The two setup failures are
retained as history; both arbitration scenarios pass after this guard-only fix.
No production Java or Luck database-verifier change is involved. Three test files
are changed in total and all final runs use identical Java hashes.


The exact local main baseline 84a44230b77f6acb469c6f969070e4c0cf409325 was exported
without a ref/checkout change, built and used to generate a synthetic pre-Luck schema.
Eight existing gameplay/participant/question rows and two Challenge histories were
rehearsed on disposable mysql:8.4.11 only, with tmpfs and localhost port 13319.
Draft expansion adds exactly ten columns and two tables. All original data/columns,
IDs, Energy and timestamps compare equal. Native enums, BIT defaults, FKs, unique and
descending indexes and enforced CHECKs are captured; four valid audit outcomes and
23 expected constraint failures pass. Real current application validate startup and
restart close with exit 0; old main mapping also validates the expansion. Unmigrated
and partially migrated negative controls exit 1 despite Luck OFF. These are mapping
startup checks, not prod-profile/Redis/deployment or application rollback acceptance.

Controlled partial DDL preserves its committed ALTER before a failed CREATE and is
refused by the rerun guard. A real metadata-lock holder causes bounded expected DDL
timeout without a new column. No script-atomic rollback or online-migration guarantee
is claimed. Target history/schema/version/data and migration ownership/ledger/restore
policy remain unknown: MIGRATION_POLICY_UNDECIDED. No target DB was accessed.

CI is an unapplied three-job proposal with separate H2, Luck MySQL and legacy
arbitration schemas. YAML parsing and Bash syntax pass; Linux/hosted CI remains
unexecuted/PENDING. Current local regression results:

- full: 1360 total, 1358 passed, 2 skipped, zero failures/errors.
- focused: 491 total, 489 passed, 2 skipped, zero failures/errors.
- ordinary: 1250 total, 1185 passed, 65 skipped, zero failures/errors.
- arbitration: 2 total, 2 passed, 0 skipped, zero failures/errors.

Exact commands/timing/profile/source hashes and new XML are retained per run. Skips
are not passes; expected rollback/create-drop warnings and helper failure history
are retained. Cached-context connection peaks and service test timings are not
production sizing/SLA evidence. Lab startup writer maximum is 10, reader default 2;
actual deployed N/W/B/reserve/DB maximum remain required owner inputs satisfying
SUM_i(W_i+R_i)<=B and B+reserved<=DB_max_connections. No default is changed.

Read-only ls-remote observed remote main equal to the local main baseline; no fetch,
merge or ref mutation occurred. Review readiness is separate from merge/deployment:
target schema/policy, hosted CI and pool topology gates remain open. Activation also
needs product approval of the unchanged provisional 60000ms window and Shimon's
client acceptance. React/Pixi/HUD/effects/audio/expiry scheduling remain Shimon's.
QUIZWHEELZ_LUCK_ANSWER_ENABLED remains false. Disposable DB/credential cleanup is
recorded. No staging, commit, publication, deployment or next checkpoint is authorized.

#### Post-merge stability fixes - 2026-10-24

**Status:** `MERGED (PR #80, main@9a41ce7); rollout OFF`

A review of main@ddfbf3c reproduced four defects that appear with Luck ON (the cleanup
one seven days later). Each has a test that failed on main and passes with the fix.
Rules, probabilities, fairness, Shield, cooldown, cap and effect lifecycle are unchanged.

1. Cross-race deadlock. This supersedes the B1 sentence that own Challenge and
   speed-window queries are "restricted to the caller's player ID": under REPEATABLE
   READ those SELECT ... FOR UPDATE reads took InnoDB gap locks beyond the caller's
   rows, so two races drawing Tailwind or Mud together deadlocked on
   race_player_speed_effects (1213, one answer rolled back). LuckOwnStateReader now
   uses plain reads. Invariant: every writer of a player's offers and speed effects
   holds that RacePlayer row lock first - answer (findLockedByIdAndRaceId), challenge
   choice, leave and reconnect (resolveAndLock), heartbeat (lock), settlement worker
   (findLockedByIdAndRaceId), finalization and finish arbitration
   (findAllLockedByRaceIdOrderById + Race lock), Luck (LuckTransactionGuard). The
   answer transaction starts with that locking read, so its later plain reads observe
   every committed write of the player. The insert-time overlap check in
   RacePlayerSpeedEffectService remains. B1LuckCrossRaceMySqlTest forces both Tailwind
   checks before either insert with a strict barrier, five repetitions per run.
2. Nightly question cleanup. race_player_luck_decisions.source_question_id (every RNG
   attempt, NO_EVENT included) and race_player_focus_events.player_question_id hold
   restricting foreign keys, so PlayerQuestionCleanupService rolled back every night
   once an old question was referenced. PlayerQuestionRepository.findCleanupCandidates
   skips referenced questions; Luck audit and focus history are kept.
   PlayerQuestionCleanupIntegrationTest covers Luck-only, focus-only, both and
   unreferenced questions and pins the tables that reference player_questions.
   Retention of the kept questions (TTL, archive or anonymisation) is an open decision.
3. Luck ON without a declared budget. The three QUIZWHEELZ_DB_* settings exist only in
   the test profile, and the peer pool failed closed on the first student answer
   (HTTP 500 for every NORMAL answer). LuckStartupVerifier, an ApplicationRunner
   registered only when QUIZWHEELZ_LUCK_ANSWER_ENABLED is true, calls
   LuckPeerJdbcResources.verifyBeforeServing() before readiness: positive limits,
   N*(W+R)<=B and, on MySQL, B+reserved<=@@max_connections. The first-use checks stay.
   Luck OFF registers no verifier and needs no peer settings.
4. Tailwind at the maximum. Speed is an unrounded double (1.9999999999999998 after
   correct EASY, EASY, HARD, HARD, MEDIUM answers from 0.5) while movement, snapshot and
   LuckEffectResolver use tenths. LuckDrawPolicy now compares in tenths, so a Tailwind
   at the shown 2.0 becomes an Energy Orb instead of a no-op event.

Unexpected 500 responses are not logged by the global catch-all handler. That gap is
older than S4-04 and is proposed as a separate change. (Closed 2026-10-25 in the S4-05
package: `GlobalExceptionHandler` logs the method, the path and the stack trace at ERROR, and a
real 500 still gets the same generic body. The live run showed that the catch-all also turned
Spring's own request errors into 500 (`GET /api/teacher/races` is POST-only: 405) and that
every SSE stream a student closed would have been logged as a failure. Spring MVC now answers
those request errors with their real status (405/404/400) and Spring Boot's standard error
JSON instead of the app's error body (the client already classifies them by status), and a
stream the student closed ends with no answer and no log line; see
`GlobalExceptionHandlerFallbackTest`. Independent review, 2026-10-26: an IOException on a
started response is not proof of a disconnect. Known disconnects (Spring's helper, or the
Windows words for Winsock 10053/10054 on an IOException) stay silent; any other IOException
after the response started leaves one WARN line and still no body.) Open release gates are
unchanged: migration policy, target budget numbers, hosted CI, product approval of the
provisional 60000 ms window and the client presentation (C5-04).

### S4-05 — Hidden Recovery

**Status:** `IMPLEMENTED behind QUIZWHEELZ_RECOVERY_ENABLED=false (default); local on feature/S4-05-C5-04-recovery-luck-shield (2026-10-25), not merged; for Diana's review`

Eligibility requires both actually being behind and demonstrably struggling.
Never grant assistance solely because a leading player intentionally answers wrong.

Rules (approved by Shimon on 2026-10-25, Diana's principle above), constants in
`common/RecoveryRules`:
- Evidence: the 6 most recent NORMAL outcomes, the current correct answer included, with
  at least 3 failures. A failure is a wrong accepted NORMAL answer or a NORMAL timeout whose
  penalty was applied. An expiry without consequence (a finished or disconnected player, a
  race not in progress) and every Challenge question never count.
- Behind: at least 12% of the track length behind the leader, at least 6% behind the median
  of the RACING players (self included), own progress at most 65%, and at least 2 RACING
  players. Ratios are compared as `BigDecimal`, like `ChallengeRules.FINISH_GATE_RATIO`.
- Grant: exactly +10 Challenge Energy, once per race player, on the first accepted correct
  NORMAL answer that meets both. It lands after the normal gain and before the offer check,
  so a meter it fills opens the offer with the same answer. When the energy after the normal
  gain is above 90 the right is kept for a later answer.
- Nothing else changes: score, position, speed, difficulty, Luck, the API (no field, no
  event) and the logs (nothing about the student). The flag is independent of the Luck flag.

Design:
- One bean, `HiddenRecoveryService`: `observeAcceptedAnswer` (from
  `ChallengeOfferService.afterAnswer`, NORMAL, RACING, IN_PROGRESS), `observePenalizedTimeout`
  (from `QuestionTimeoutService.applyTimeoutConsequence`, right after the NORMAL penalty) and
  `nudgeAfterNormalGain` (after `ChallengeEnergyService.earn`). All are
  `Propagation.MANDATORY`: they run only inside the answer or timeout transaction that
  already holds the RacePlayer PESSIMISTIC_WRITE lock, so a rollback undoes the energy and the
  award together.
- The callers take `ObjectProvider<HiddenRecoveryService>`, the `AcceptedAnswerLuckService`
  pattern: the sliced test contexts that build `ChallengeOfferService` or
  `QuestionTimeoutService` need no Recovery bean, and in production the bean is always
  present.
- One standings projection per answer: `StudentAnswerSubmissionService` calculates the
  standing once, after the answer is applied and before the offer step, and passes it to
  `ChallengeOfferService.afterAnswer`; Recovery reads its field from it and the response reuses
  it. Answers in a race already wait for each other on the race row, so a second projection of
  every classmate there (two Redis reads each) would have slowed the whole race. Nothing after
  that point moves a player at the decision instant (a Luck effect only starts then).
- Pure, unit-tested rules in `RecoveryPolicy`, a plain policy object the service holds as a
  field, like `GuardShieldService` holds `GuardShieldPolicy`: a 6-bit window (newest outcome in
  bit 0, 1 = correct), failures, room for the nudge, the gaps, and the standing it returns as the
  plain `RecoveryStanding` record (leader, an exact median and the count over the RACING
  classmates, projected to the decision instant, and the student; a finished player is not part
  of the field).
- After the one grant, later answers write nothing to the Recovery row.
- An old or repeated question id is ignored (one WARN for an older one), never thrown:
  Recovery must never turn a student's answer into an error. The energy goes through
  `ChallengeEnergyService.addRecoveryNudge`, which has one purpose and takes its amount from
  `RecoveryRules`; its guard cannot fire because the policy checks the room first.
- State: `race_player_recovery_states`, one row per race player (the window, the last
  observed NORMAL question and the award). Question ids are plain columns, not foreign
  keys, because the nightly cleanup deletes old questions. Nothing in the server deletes race
  players or races, so the race player foreign key never blocks a deletion.

Schema: dev (`ddl-auto=update`) and the tests create the table. Production uses `validate`,
which checks every mapped entity at startup, so this DDL must run before this build is
deployed, whether the flag is on or off (production migrations remain Phase 6; see the S4-04
deployment gate). It is the table Hibernate created on MySQL 8.4 in the live run, with readable
constraint names:

```sql
CREATE TABLE race_player_recovery_states (
  id bigint NOT NULL AUTO_INCREMENT,
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) DEFAULT NULL,
  awarded_at_epoch_ms bigint DEFAULT NULL,
  awarded_energy int NOT NULL DEFAULT '0',
  awarded_question_id bigint DEFAULT NULL,
  last_observed_normal_question_id bigint DEFAULT NULL,
  recent_outcome_bits int NOT NULL DEFAULT '0',
  recent_outcome_count int NOT NULL DEFAULT '0',
  race_player_id bigint NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_race_player_recovery_states_player (race_player_id),
  CONSTRAINT fk_race_player_recovery_states_player FOREIGN KEY (race_player_id)
    REFERENCES race_players (id),
  CONSTRAINT chk_race_player_recovery_states CHECK (recent_outcome_bits BETWEEN 0 AND 63
    AND recent_outcome_count BETWEEN 0 AND 6 AND awarded_energy IN (0, 10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Evidence (2026-10-25): `RecoveryPolicyTest` 25 and `RecoveryStandingTest` 4;
`HiddenRecoveryIntegrationTest` 14 on H2 and the same 14 on MySQL 8.4
(`HiddenRecoveryIntegrationMySqlTest`), including a qualifying answer that projects the
standings no more often than an ordinary one, a Challenge answer that never enters the window,
an overdue answer whose penalized timeout commits with `QUESTION_EXPIRED`, a finished leader left
out of the field, and two parallel submissions that grant once; `HiddenRecoveryOffIntegrationTest`
1. The full H2 suite passes (1,409 tests) and so does the full MySQL 8.4 suite on a disposable
container (212 tests in 15 classes). The live API run on a disposable MySQL and Redis
passed with the four Recovery × Luck combinations, with 0 server errors and no Recovery text in
any response: `docs/vision/s4_05_c5_04_2026-10-25/evidence/live/`.

Open before Recovery is enabled (independent review, 2026-10-26; the flag stays false until all
three are closed):
- Product, Diana's written approval: a FINISHED player is not part of the field, so a finished
  leader no longer makes a classmate "behind"; and a STRICT focus forfeit counts as a failure,
  because it goes through the penalized timeout path (`forfeitActiveQuestionAsTimeout`).
- Deployment: the DDL above runs before this build is deployed. Nothing runs DDL against an
  existing database automatically or without approval.
- Measurement gate, before any cache is considered: p50 and p95 of answer submission and of
  offer opening with 2, 4 and 8 RACING students, after a warm-up, several repetitions per size,
  with Recovery and Luck each ON and OFF. The 2026-10-25 latency run is a smoke check with few
  offer rounds, not proof that p95 did not regress.

### S4-06 — Race Moments / announcements

**Status:** `PLANNED`

Server-owned bounded race notices use the existing RaceLiveEvent infrastructure.
Add visible event vocabulary only when the corresponding gameplay exists.

## S5 — Full auth and 2FA

Follow `AUTH_REGISTRATION_AND_2FA.md`.

## S6 — Production

- migrations
- secret management
- secure cookies/CORS/CSRF review
- CI
- deployment
- load and observability.
