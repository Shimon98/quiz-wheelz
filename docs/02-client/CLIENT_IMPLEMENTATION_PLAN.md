# Client Implementation Plan

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the ordered frontend task list with integration dependencies and completion gates

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Task metadata format

```yaml
id: C1-01
status: TODO
area: client
depends_on: [S1-01]
blocks: [C1-02]
contract_owner: server
```

## C0 — Documentation and contract cleanup

### C0-01 — Replace legacy documentation

Use this package, remove nested READMEs and verify no stale links.

### C0-02 — Endpoint and route constants

**Status: DONE**

Completed:

- verified RacePlayer gameplay/runtime paths against the current server `ApiPaths`
- marked race-state as live
- registered heartbeat, leave, and reconnect endpoint constants
- added the future `/student/race` route constant
- removed stale "endpoint not implemented" comments
- verified active client code does not duplicate these endpoint strings
- intentionally did not wire the real student race route; that begins in C1-01

### C0-03 — Package audit

**Status: DONE**

Completed:

- audited client animation dependencies
- kept `framer-motion` as the active React UI animation library
- removed unused `motion`
- confirmed the student race renderer uses manual `pixi.js`
- removed unused `@pixi/react`
- removed `pixi-filters` after repository-wide source search confirmed zero usage
- regenerated the npm lockfile through npm
- verified client lint and production build

**C0 COMPLETE**

## C1 — Student playable loop

### C1-01 — Race route and bootstrap

Depends on frozen race-state contract.

#### C1-01-ERR — Shared API error foundation

**Status: DONE**

Completed:

- normalized every API failure to one shape:
  `{ status, code, errorName, category, messageKey, validationErrors }`
- decisions now use the semantic server error name; numeric codes are debug
  metadata only (stale `errorCodes.js` removed, `serverErrorNames.js` added)
- added error categories + `errorChecks` predicates
  (network / auth session / RacePlayer session / server / contract / transient)
- separated teacher auth session from RacePlayer session — a RacePlayer 401
  no longer clears the teacher auth store
- network/5xx failures no longer log the teacher out (`loadCurrentUser`)
- malformed success envelopes fail fast as `ApiContractError` (API_CONTRACT)
- consolidated toasts into `appNotifications` (removed duplicate
  `useApiErrorNotifier`); login now shows "wrong credentials", not
  "session expired"

- add `/student/race`
- add RacePlayer-session guard
- fetch race-state first
- route by server race/player status
- map server snapshot to `StudentRaceRuntimeState`
- waiting → waiting page
- active → race screen
- finished → finish state.

### C1-02 — Question panel and timer

- create `studentRace` i18n namespace
- real question text/four answers
- large mobile targets
- loading/error/retry
- visual timer
- at zero, lock input and refetch; server decides expiry
- no correctness logic.

### C1-03 — Submit answer and snapshot mapping

```text
select answer
→ disable buttons
→ submit selectedChoiceId
→ show server result
→ apply returned snapshot target
→ fetch/receive next question
```

All timings come from one feature config.

### C1-04 — HUD

Render only fields provided by the server:

- score
- streak
- timer
- progress
- speed/effect state
- rank only after S1-02.

### C1-05 — Presence/reconnect

- heartbeat interval
- `visibilitychange`/page lifecycle policy
- explicit leave where appropriate
- reconnect on refresh/network recovery
- friendly session-expired state
- do not navigate based on local guess.

### C1-06 — Real asset pass and hover kart

- asset manifest keys
- metadata-driven props
- hover kart base/color/shadow/trail
- correct/wrong/boost effects
- no wheel animation.

**C1 gate:** complete real single-player race flow including refresh/reconnect.

## C2 — Opponents

Depends on S1-02.

- extend projection with lateral `laneDelta`
- opponent interpolation keyed by RacePlayer ID
- hidden/entering/visible/exiting state machine
- hysteresis/fades
- depth-zone caps
- object pooling
- server color keys
- no visual depth cheating.

## C3 — Teacher live race

Depends on S2.

### C3-01 — Route and initial state

Wire the existing live route constant only when the page and endpoint exist.

### C3-02 — SSE hook

- connect after initial query
- apply snapshots/events
- reconnect with last event/version when supported
- refetch on stream recovery failure
- clean up on unmount.

### C3-03 — Projector UI

- race track/players
- leaderboard
- room/status/time
- live event feed
- responsive desktop/projector layout
- no client rank or overtake inference.

## C4 — Results

- student finish state
- teacher results route/page
- final ranking/statistics
- return to dashboard/race history.

## C5 — Required gameplay UI

- junction offer
- highway/dirt-road question modes
- fair luck effects
- assistance presentation
- live announcements.

All visual effects consume server events/effects.

## C6 — Full auth UI integration

- registration
- email verification
- reset
- TOTP setup/challenge/recovery.

Follow server contracts; never simulate missing endpoints.
