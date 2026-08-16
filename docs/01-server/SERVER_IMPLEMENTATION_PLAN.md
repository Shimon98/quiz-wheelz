# Server Implementation Plan

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the ordered backend task list with dependencies and integration outputs

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Task metadata format

Every server task/issue should begin with:

```yaml
id: S1-01
status: TODO
area: server
depends_on: [S0-02]
blocks: [C1-01]
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

**Status:** `PLANNED`

- keep Redis presence TTL
- update `RacePlayer.lastSeenAt` at a bounded interval or each heartbeat
- reconnect lookup order:

```text
Redis last heartbeat
→ DB lastSeenAt
→ race startedAt/fallback policy
```

- test Redis loss/restart and reconnect grace.

**Blocks:** reliable client reconnect integration.

### S0-03 — Runtime dependency/config cleanup

**Status:** `PLANNED`

- verify whether WebSocket starter is unused
- verify Docker Compose dependency behavior
- remove stale Redis properties/comments only after S0-01
- update OpenAPI/dev docs.

## S1 — Student playable-loop contract closure

### S1-01 — Verify and freeze student contracts

**Status:** `PLANNED`

- re-read actual controller/DTO source
- freeze race-state, current-question, answer-impact, heartbeat, leave and reconnect
  responses
- ensure all endpoints use `ApiPaths`
- add contract/serialization tests
- update client endpoint constants in the matching client PR.

### S1-02 — Authoritative rank and nearby-player snapshot

**Status:** `PLANNED`

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

Rules:

- rank comes from server ordering
- lane is not rank
- nearby selection must never change authoritative depth
- omit sensitive/internal fields
- test ties and finished players.

**Blocks:** opponent layer and rank HUD.

### S1-03 — Runtime action hardening

**Status:** `PLANNED`

- test refresh during WAITING/RACING/FINISHED
- test duplicate heartbeat/leave/reconnect
- test expired question followed by reload
- test answer after disconnect/finish
- verify idempotent outcomes where appropriate.

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
