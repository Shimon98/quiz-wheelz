# Architecture and Contracts

**Status:** Canonical  
**Audit date:** 2026-08-23
**Code baseline:** `main@14f16e8d91c522a1f6d44129b1bf5e89e107f3a2`
**This document owns:** the cross-system architecture, data ownership, API boundaries and runtime contracts

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## System map

```text
React application
  ├─ Teacher application UI (Mantine)
  ├─ Student application UI (Mantine)
  └─ Student race world (manual PixiJS)
            │
            │ REST commands/queries + cookies
            │ future teacher SSE stream
            ▼
Spring Boot
  ├─ Security/session resolution
  ├─ Teacher race services
  ├─ Question generation/delivery/answer services
  ├─ Race engine and policies
  ├─ Runtime snapshot/live-event services
  └─ Persistence/cache adapters
            │
      ┌─────┴─────┐
      ▼           ▼
    MySQL       Redis
  durable truth  temporary runtime/presence
```

## Data ownership

### MySQL

Owns durable data:

- users, roles and security state
- subjects and question templates
- races and RacePlayers
- generated questions and choices
- submitted answers
- durable progress/finish state
- future effects/events/results
- `lastSeenAt` fallback for reconnect.

### Redis

Owns temporary acceleration/runtime state:

- online presence TTL
- latest trusted gameplay-activity cache (player-originated requests only)
- future live snapshots/leaderboard cache
- future active-question lookup cache when useful.

Redis loss must degrade performance or online indicators, not corrupt game truth.
Gameplay presence fails open during a Redis outage: movement remains available,
players are not mass-disconnected, and durable `lastSeenAt` checkpoints remain the
fallback.

Presence lease and trusted gameplay activity are separate runtime concepts. Only
heartbeat and reconnect create or renew the 45-second presence lease. Active
`RACING + IN_PROGRESS` race-state, current-question and answer requests may record
monotonic trusted activity, but an absent active player must complete explicit
reconnect first. An absent active gameplay request settles only to the trusted
cutoff, never re-anchors, records no activity, and returns
`RACE_PLAYER_RECONNECT_REQUIRED`; terminal/non-playable race-state remains readable
without presence and records no activity. Grace expiry durably becomes DISCONNECTED.
Durable `lastSeenAt` changes only through the 30-second heartbeat checkpoint gate or
direct Redis-failure fallback.

Heartbeat renews only an existing valid presence lease. If the lease is missing
inside grace, heartbeat settles to the trusted cutoff without reconnect re-anchoring
or lease recreation and returns `RACE_PLAYER_RECONNECT_REQUIRED`; only the explicit
reconnect command may call reconnect settlement and restore presence.

### Client

Owns presentation-only state:

- open modal/drawer
- loading/error/feedback state
- current UI language/theme
- visual interpolation targets
- Pixi camera/world offset
- animation phase.

## Identity boundaries

```text
Teacher:
registered User + teacher JWT HttpOnly cookie

RacePlayer:
participant in one race + separate race-specific JWT/cookie
```

Do not merge the concepts. A future registered student profile is a separate domain.

## Current API surface

### Authentication

```http
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

Planned:

```http
POST /api/auth/register
POST /api/auth/email-verification/send
POST /api/auth/email-verification/verify
POST /api/auth/password/forgot
POST /api/auth/password/verify-code
POST /api/auth/password/reset
POST /api/auth/2fa/setup
POST /api/auth/2fa/verify
```

Exact future paths must be agreed in `ApiPaths` before client wiring.

### Teacher

```http
GET  /api/subjects
GET  /api/teacher/dashboard
GET  /api/teacher/races
POST /api/teacher/races
GET  /api/teacher/races/{raceId}/room
POST /api/teacher/races/{raceId}/start
```

Planned:

```http
GET /api/teacher/races/{raceId}/live-state
GET /api/teacher/races/{raceId}/events
GET /api/teacher/races/{raceId}/results
```

SSE will use a dedicated teacher-owned stream path decided by the server plan.

### RacePlayer

```http
POST /api/race-players/join
GET  /api/race-players/me/race-state
POST /api/race-players/me/question/current
POST /api/race-players/me/answers
POST /api/race-players/me/heartbeat
POST /api/race-players/me/leave
POST /api/race-players/me/reconnect
```

## Shared runtime snapshot

Every student state source maps into one client runtime shape:

```json
{
  "raceId": 12,
  "raceTitle": "Multiplication Race",
  "roomCode": "ABC123",
  "startedAt": "2026-08-19T16:00:00",
  "finishedAt": null,
  "player": {
    "racePlayerId": 91,
    "displayName": "Noa",
    "laneNumber": 3,
    "vehicleTypeKey": "HOVER_KART",
    "vehicleColorKey": "GREEN",
    "vehicleAssetKey": "HOVER_KART_GREEN"
  },
  "snapshot": {
    "totalDistance": 1000,
    "score": 420,
    "position": 350,
    "speed": 1.2,
    "streak": 3,
    "highestStreak": 5,
    "currentDifficulty": "MEDIUM",
    "playerStatus": "RACING",
    "raceStatus": "IN_PROGRESS",
    "playerFinished": false,
    "raceFinished": false,
    "snapshotAtEpochMs": 1787148000000,
    "movementUnitsPerSecond": 4.8,
    "rank": 2,
    "playerCount": 5,
    "nearbyPlayers": [
      {
        "racePlayerId": 92,
        "displayName": "Avi",
        "laneNumber": 4,
        "vehicleTypeKey": "HOVER_KART",
        "vehicleColorKey": "BLUE",
        "position": 420.0,
        "speed": 1.3,
        "status": "DISCONNECTED"
      }
    ]
  }
}
```

The answer response contains deltas plus the same snapshot shape. The `player`
block owns stable presentation identity only; `snapshot.playerStatus` remains the
single owner of runtime player status.

The shared race-state and submit-answer snapshot also owns authoritative standings.
All joined RacePlayers count. FINISHED players precede non-finished players and are
ordered by `finishedAt`; non-finished players, including DISCONNECTED, are ordered by
stored position. Exact ties use competition rank, while ID/lane may stabilize output
order only and never change rank. `nearbyPlayers` excludes the current player, exposes
only safe presentation/movement fields, and contains at most four opponents in
standing order, preferring two immediately ahead and two immediately behind and
filling from the available side.

Approved answer semantics:

```text
CORRECT → answer-derived progress bonus + speed boost
WRONG   → no answer-derived progress bonus + speed penalty
TIMEOUT → no answer-derived progress bonus + stronger speed penalty
```

Baseline server-authoritative movement continues after wrong answers and timeouts
while trustworthy gameplay presence is active. Real absence freezes position at the
latest trusted player-originated activity, but question wall-clock deadlines and
exactly-once timeout penalties continue. Reconnect grants no catch-up movement: it
re-anchors at reconnect time. The 5-minute grace is a right to return while the race
is active, not a right for an absent player to block race completion. Reconnect
remains a focused command: when continuation is possible, the client follows it with
`GET race-state` to rebuild the latest state.

A hidden student document is temporary gameplay absence, not an immediate durable
disconnect. Hidden stops heartbeat, race-state polling, current-question requests
and answer submission. Returning visible runs reconnect first and performs an
authoritative resync before gameplay resumes. Presence expiry is expected during a
long hidden interval; movement still stops at the latest trusted activity rather
than waiting for the presence TTL.

The same runtime-session owner handles semantic `RACE_PLAYER_RECONNECT_REQUIRED`
failures from race-state, current-question and answer. It closes gameplay readiness,
reconnects, then uses the existing resync token to rebuild authoritative state;
answer submission is never replayed automatically.

Core runtime repeat policy:

```text
race-state       → repeat-safe materialization; same-instant reads award nothing extra
heartbeat        → repeat-safe; never reconnects or re-anchors
reconnect        → repeat-safe for state/movement; only a real resume re-anchors
leave            → state-idempotent; repeated DISCONNECTED leave has no gameplay effects
current-question → repeat-safe for the same ACTIVE identity and original expiresAt
answer           → exactly-once gameplay mutation; duplicate submit is rejected
```

These guarantees use the existing per-RacePlayer lock and lifecycle owners. They add
no replay-success protocol, request identifier, presence recreation, Redis state or
public contract.

Focus integrity foundation uses a separate server-only audit command:

```text
POST /api/race-players/me/focus-events
request  → eventId, type = TAB_HIDDEN | TAB_VISIBLE
response → eventId, type, outcome, focusLossCount, questionFocusLossCount,
           activeQuestionId, recordedAtEpochMs
```

The RacePlayer session selects and locks the target; the client supplies no player,
race, question or timestamp. MySQL stores the cumulative RacePlayer total and an
immutable event row associated with the server-resolved ACTIVE question. Replaying
the same event ID and type returns the stored historic result; a conflicting type is
rejected. The first counted loss for one question is `WARNING`, and later counted
losses for that question are `VIOLATION`; a new question starts its own count while
the race total remains cumulative.

The non-null RacePlayer focus summary columns carry database defaults of `0` and
`VISIBLE`, allowing DEV `ddl-auto=update` to backfill existing rows safely. This is
not a production migration; production migrations remain Phase 6 debt.

Focus classification has no gameplay consequence in S1-03A. Focus events never
renew presence, record gameplay activity, settle or re-anchor movement, reconnect,
change a question deadline/status, or apply answer/timeout effects. `WARNING` and
`VIOLATION` are durable detection only; forfeiture and configurable strict policy
remain S1-03B.

An ACTIVE question remains owned by its RacePlayer across hidden, reload,
disconnect and reconnect transitions until it becomes ANSWERED or EXPIRED. Its
`expiresAt` never shifts. An overdue question is processed as EXPIRED exactly once
before another question may be delivered, so lifecycle transitions cannot be used
to fish for questions.
Future SSE data must reuse the snapshot vocabulary instead of inventing a parallel
runtime model.

## Command/query rule

State-changing commands return focused results. Pages load their own query model.

Example:

```text
POST start race
→ short start result

GET teacher live-state
→ complete live screen state
```

Do not return an entire live page model from every command.

## Live-update strategy

### Now

- REST for teacher commands.
- REST for RacePlayer question/answer/runtime actions.
- Polling only as a documented temporary bridge.

### Next

- Initial teacher live-state query.
- SSE for teacher snapshots/events.
- Reconnect by refetching the latest server state.
- Client interpolation between snapshots.

### Not now

WebSocket remains unapproved until a two-way real-time interaction cannot be handled
cleanly by REST commands plus SSE.
