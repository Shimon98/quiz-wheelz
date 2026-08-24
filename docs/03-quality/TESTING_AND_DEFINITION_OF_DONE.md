# Testing and Definition of Done

**Status:** Canonical  
**Audit date:** 2026-08-24
**Code baseline:** `main@a1cfa8faa716accccde9ddfd6119a64f33ca50d8`
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
- question identity and original deadline survive hidden/reload/reconnect
- no question fishing through repeated reconnect or current-question requests
- duplicate answer rejection
- score/progress/streak/difficulty
- player/race finish
- heartbeat/leave/reconnect
- repeated WAITING/online-RACING/FINISHED/DISCONNECTED/finished-race refresh, including
  stable identity/status, no duplicate RacePlayer and no terminal presence requirement
- consecutive valid heartbeats without reconnect, settlement, re-anchor or illegal
  transition; terminal/disconnected heartbeat cannot resurrect a player
- duplicate reconnect: one absent-player resume re-anchor, then no second re-anchor;
  repeated WAITING/FINISHED/DISCONNECTED/finished-race outcomes remain stable
- duplicate leave: first active leave settles and persists once; repeated
  DISCONNECTED leave performs only best-effort offline cleanup; FINISHED stays FINISHED
- heartbeat with a missing lease settles to the trusted cutoff, performs no reconnect
  settlement/re-anchor or lease recreation, and requires explicit reconnect
- trusted-activity monotonicity and absence movement cutoff
- repeated absent sweeps and reconnect-without-catch-up
- online, absent-inside-grace, grace-expired and Redis-unavailable gameplay-request
  guard paths, plus race-state/current-question/answer guard delegation
- finished/disconnected/terminal-race race-state remains readable without presence
  or gameplay-activity writes; active race-state still requires reconnect
- terminal state reached during gameplay-request settlement wins over the older
  reconnect-required/window-expired presence decision
- only explicit reconnect may re-anchor; direct gameplay requests must not
- authoritative student standings count all joined players and rank FINISHED players
  by finish time before position-ranked waiting/racing/disconnected players
- standings use competition rank for exact ties, deterministic ordering without
  lane/ID rank influence, and an immutable max-4 nearby window that excludes self
- race-state and submit-answer serialize the same non-null rank/player-count/nearby
  vocabulary after current-request mutation, with exact-field nearby no-leak coverage
- question wall-clock timeout during absence, exactly once, without deadline extension
- expired-current-question reload applies timeout and generation once; the next
  current-question repeat returns the same ACTIVE identity and original deadline
- answers after DISCONNECTED, player FINISHED or race FINISHED leave question and
  gameplay state unchanged; duplicate ANSWERED submit cannot invoke the engine twice
- focus-event exact request/response fields and enum vocabulary, current-session-only
  targeting, server time and server-owned ACTIVE-question association
- focus visible/hidden transitions, first-loss WARNING, second+ VIOLATION, cumulative
  race total and question-local reset on a new ACTIVE question
- focus same-ID historic replay, conflicting-type rejection, repeated hidden/visible
  safety, unique DB constraint and same-event-ID allowance across different players
- focus RacePlayer summary metadata declares non-null DB defaults of `0` and
  `VISIBLE` for existing-row DEV `ddl-auto=update` compatibility
- WAITING/FINISHED/DISCONNECTED/finished-race/no-question/expired-question focus
  ignores with no question, score, speed, position, streak or difficulty mutation
- structural focus isolation from presence renewal/activity, movement settlement,
  reconnect/re-anchor and answer/timeout engine owners
- race focus-policy OFF/WARN/STRICT creation, omitted-WARN default, DB default and
  exact teacher summary/room serialization
- OFF ignored/no-count behavior; WARN third-loss VIOLATION regression; STRICT same-
  question WARNING→VIOLATION→FORFEITED and new-question local-count reset
- strict forfeit delegates ACTIVE→EXPIRED and one timeout consequence to the existing
  owner; replay/conflict bypass repeated timeout, movement and engine effects
- strict absence movement cutoff does not use focus request time, renew presence,
  record activity, reconnect or re-anchor; Redis outage uses durable cutoff fallback
- absent-player race completion and terminal grace expiry
- Redis loss with DB fallback
- Redis-loss fail-open movement/no mass disconnect
- live-state ownership
- SSE reconnect/recovery
- event fairness boundaries.

## Client checks

```bash
cd client
npm run test
npm run lint
npm run build
```

Client automated tests (Vitest + jsdom + React Testing Library, policy since
C1-04):

- new client behavior ships with focused automated tests when meaningful
- pure logic → unit tests; React UI behavior → component tests
- protect behavior and contracts, not implementation trivia (class order,
  decorative icons, private structure, Pixi frame animation)
- no retroactive full-suite backfill; touched high-risk legacy behavior
  gains regression tests when practical.

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
- hidden document: heartbeat and gameplay calls stop; gameplay-ready is false;
  no automatic leave
- visible return: reconnect and authoritative resync complete before gameplay resumes
- semantic reconnect-required from race-state/question/answer uses the one runtime
  reconnect owner; reconnect-window expiry stays terminal and answer POST is never
  automatically retried
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

## Infrastructure development-startup check

- existing local MySQL at `localhost:3306/quiz_wheelz` remains the DEV database
- no manual Redis start
- no source edit for credentials
- Redis Compose service healthy
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
- tests were skipped without explanation
- an added or modified `.java`, `.js` or `.jsx` file contains comments or
  exceeds 500 lines
- a touched service or test combines multiple responsibilities that have clear
  independent owners
- logger templates or repeated operation labels remain inline at call sites.
