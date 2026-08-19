# Master Implementation Roadmap

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the only cross-server/client implementation order and phase gates

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Planning rule

Server and client have separate detailed plans, but work starts only from this
cross-system order. A phase closes when its integration gate passes, not when each
side says its files are finished.

## Phase 0 — Documentation and reproducible development

**Goal:** every developer can understand and start the project consistently.

Server:
- restore/verify the existing local MySQL workflow
- merge/verify automatic Redis startup
- remove mixed/manual Redis startup behavior
- add durable `lastSeenAt` fallback
- verify local development startup.

Client:
- replace old docs and nested READMEs
- fix stale endpoint comments/constants
- verify baseline build.

**Gate:**

```text
Existing local MySQL is available at localhost:3306
→ run backend from server working directory
→ Redis starts automatically
→ backend tests pass
→ client lint/build pass
```

## Phase 1 — Real student playable loop

**Goal:** one RacePlayer can play from start to finish against real server state.

Server:
- verify race-state and answer snapshot contracts
- authoritative continuous movement + guaranteed finish (S1-01A — DONE)
- expose any missing safe fields required by the student UI
- keep heartbeat/reconnect behavior stable
- add rank only when the server can calculate it authoritatively.

Client:
- real `/student/race` route and guard
- race-state bootstrap
- question panel, timer and i18n
- submit answer and map snapshot
- HUD
- heartbeat, leave, refresh and reconnect
- hover-kart motion driven by server target position.

**Gate:**

```text
Create race
→ join
→ start
→ load student race
→ answer multiple questions
→ kart moves from server snapshots
→ refresh/reconnect recovers
→ finish state appears
```

## Phase 2 — Teacher live race and SSE

**Goal:** the projected teacher screen shows all active players in real time.

Server:
- teacher-owned live-state endpoint
- rank/leaderboard calculation
- SSE stream and event publication
- snapshot recovery on reconnect.

Client:
- live route/page
- initial query
- SSE hook with reconnect/fallback
- projector-friendly track/leaderboard
- server-owned live notices.

**Gate:** an answer on the student device visibly changes the teacher display without
manual refresh, and reconnect restores current state.

## Phase 3 — Results and integration closure

**Goal:** the core race has a complete start-to-results lifecycle.

Server:
- durable result model/query if not already sufficient
- final ranking and statistics
- idempotent finish behavior.

Client:
- student finish state
- teacher results screen
- dashboard navigation to active/finished races.

**Gate:** a complete multi-player race can be demonstrated from login through results.

## Phase 4 — Lecturer gameplay requirements

**Goal:** implement required strategic/fairness gameplay without destabilizing the
core loop.

Order:

1. GameEvent/effect contract.
2. Junction eligibility and offer.
3. Highway hard-question path.
4. Dirt-road easy-sequence path.
5. Controlled luck events.
6. Catch-up assistance policy.
7. Overtake/streak/bonus announcements.
8. Confirm open-race browsing requirement.

**Gate:** each event is server-authoritative, persisted/auditable where needed,
bounded by fairness rules, recoverable after refresh, and rendered without client
rule duplication.

## Phase 5 — Full teacher identity and 2FA

**Goal:** complete the lecturer-required account system.

- registration
- unique verified email
- email verification
- forgot/reset password
- generic anti-enumeration responses
- rate limiting
- TOTP setup/confirmation/recovery
- 2FA login challenge
- security-event tests.

**Gate:** a new teacher can register, verify, enable 2FA, sign in securely, recover
access and use the existing dashboard.

## Phase 6 — Production hardening

- Flyway/Liquibase migrations
- production profiles and secrets
- HTTPS/cookie/CORS/CSRF review
- structured logging/metrics
- CI
- deployment
- load and reconnect tests
- accessibility and responsive closure
- dependency cleanup.

## Parallel-work rule

Parallel work is allowed only when contracts are stable and file ownership does not
overlap. Example:

```text
Server live-state DTO/service
│
└── agreed JSON contract
    │
    ├── client mapper/route
    └── server SSE publisher
```

Do not build client UI against an imagined response while the server contract is
still changing.
