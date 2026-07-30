# Testing and Definition of Done

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the complete automated/manual quality bar for every feature and phase

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Universal definition of done

A task is done only when:

- agreed scope is implemented
- out-of-scope work was not mixed in
- real contracts are used
- validation/authorization pass
- loading/error/empty/disabled states exist
- tests pass
- responsive/accessibility checks pass where relevant
- no stale duplicate implementation remains
- canonical documentation status is updated
- demo flow works from a clean state.

## Server checks

```bash
cd server
./mvnw clean test
```

Test categories:

- service/policy unit tests
- repository/locking tests
- security/controller integration
- serialization/no-leak tests
- Redis/runtime integration where needed
- clean application startup.

Required gameplay tests:

- valid/invalid join
- capacity and lane uniqueness
- start ownership/status/player-count
- question generation constraints
- exactly four unique choices
- no correct-answer leak
- question ownership/expiry
- duplicate answer rejection
- score/progress/streak/difficulty
- player/race finish
- heartbeat/leave/reconnect
- Redis loss with DB fallback
- live-state ownership
- SSE reconnect/recovery
- event fairness boundaries.

## Client checks

```bash
cd client
npm run lint
npm run build
```

Manual viewport matrix:

```text
320
375
390
430
768
1024
1200
1366
1440
```

Check:

- Hebrew RTL
- English LTR
- light/dark
- no horizontal scroll
- touch targets
- focus/keyboard for non-game UI
- reduced motion
- loading/error/empty/disabled
- repeated-click prevention
- refresh/back/reconnect
- production bundle contains no dev race tools.

## Core end-to-end demo

```text
teacher login
→ create race
→ student join
→ teacher sees participant
→ teacher starts
→ student loads real question
→ submits correct/wrong answers
→ server updates snapshot
→ kart and HUD update
→ refresh/reconnect
→ finish
→ teacher sees final state/results
```

## Infrastructure clean-clone check

- no local DB creation
- no manual Redis start
- no source edit for credentials
- Compose services healthy
- seed data created idempotently
- restarting server preserves durable state
- Redis restart does not break durable rules.

## PR rejection conditions

Reject when:

- client calculates server-owned state
- endpoint/string is hardcoded outside canonical owner
- text is hardcoded despite i18n namespace
- controller contains business logic
- generated question is returned before persistence
- correct answer is exposed
- cache is only source of truth
- fake data is presented as real
- unrelated refactor bloats the PR
- tests were skipped without explanation.
