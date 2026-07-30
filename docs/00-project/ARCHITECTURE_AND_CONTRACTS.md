# Architecture and Contracts

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
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
- last heartbeat cache
- future live snapshots/leaderboard cache
- future active-question lookup cache when useful.

Redis loss must degrade performance or online indicators, not corrupt game truth.

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
GET  /api/race-players/me/question/current
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
  "startedAt": "2026-07-30T10:00:00",
  "finishedAt": null,
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
    "raceFinished": false
  }
}
```

The answer response should contain deltas plus the same snapshot shape. Future
reconnect and SSE data must reuse the same vocabulary instead of inventing another
parallel state object.

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
