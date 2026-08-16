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

The WebSocket starter is installed, but the approved live strategy is REST + SSE.
Remove it later only after import search confirms it is unused.

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
- heartbeat, leave and reconnect grace.

### Question flow

- reusable `QuestionTemplate`
- template selection
- operator/difficulty generation patterns
- unique four-choice generation
- generated question and choice persistence
- current-question delivery
- expiry handling
- safe DTOs
- answer validation and persistence
- duplicate-submit protection.

### Race engine

- score delta
- progress/position
- speed
- streak/highest streak
- difficulty progression
- correct/wrong counters
- player finish
- basic race finish
- answer response with reusable runtime snapshot.

## Partial or missing

- DB `lastSeenAt` fallback for missing Redis heartbeat.
- Teacher live-state query.
- Teacher SSE stream.
- Nearby-player/rank data needed by student opponents/HUD.
- Durable final-results query/model closure.
- Event/effect system for junction/luck/announcements.
- Catch-up-assistance policy.
- Registration, email verification, reset and 2FA.
- Database migrations and production deployment.

## Known configuration mismatch on audited main

The current development profile:

- connects to a manually available local MySQL
- requires Redis
- asks Spring Boot to start a root Redis-only compose file
- uses `start-only`
- keeps a Docker Compose ignore label on Redis.

This is neither fully automatic nor a clean single-owner configuration. The target
is specified in `DEV_INFRA_MYSQL_REDIS.md`.

## Current server priority

```text
Infrastructure reliability
→ student playable-loop contract closure
→ teacher live-state/SSE
→ results
→ game events
→ full auth/2FA
```
