# Client Implementation Plan

**Status:** Canonical  
**Audit date:** 2026-08-19
**Code baseline:** `main@74402e6a8d702ca0299568e2130ce88dcb7a3917`
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

**Status: DONE — E2E verified 2026-08-17** (join → waiting → teacher start →
automatic transition → race bootstrap → Pixi screen, plus refresh, direct
entry and invalid-session recovery, all against the live local server).

Capability delivered:

```text
Join
→ Waiting (temporary race-state polling, ~2s)
→ Teacher starts race
→ PLAYING detected
→ /student/race (replace)
→ race-state bootstrap
→ runtime mapping
→ StudentRaceScreen (Pixi)
```

Refresh / direct entry:

```text
/student/race load or refresh
→ server resolves HttpOnly RacePlayer cookie
→ GET race-state
→ runtime rebuilt from server truth only
```

Invalid RacePlayer session (any student race surface):

```text
normalized RACE_PLAYER_SESSION error
→ RacePlayerSessionGate
→ /join (replace)
```

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

#### C1-01 step breakdown (A–I)

| Step | Responsibility | Implementation | Status |
|------|----------------|----------------|--------|
| C1-01A | Race-state API wrapper | `getRaceState()` in `api/racePlayerApi.js` | DONE |
| C1-01-ERR | Shared semantic API error foundation | `errors/` normalize + categories + checks (see above) | DONE (supporting prerequisite) |
| C1-01B | Server → runtime mapping | `mapRaceStateToRuntime` + `applyRaceSnapshot` | DONE |
| C1-01C | Bootstrap/controller layer | `shared/racePlayer/useRacePlayerState` + `useRaceBootstrap` | DONE |
| C1-01D | StudentRacePage | page + `StudentRaceStatusView` + shared `RetryableErrorAlert` + `studentRace` i18n | DONE |
| C1-01E | RacePlayer session policy | server-validated cookie + `shared/racePlayer/RacePlayerSessionGate` | DONE |
| C1-01F | Status routing / view resolution | `shared/racePlayer/getRaceView` (`RACE_VIEWS`) | DONE — absorbed into C |
| C1-01G | Waiting → race transition | `studentJoin/hooks/useWaitingRace` + `STUDENT_WAITING_POLL_MS` | DONE |
| C1-01H | Production `/student/race` route | standalone lazy route in `AppRouter`, outside `StudentShell` | DONE — built with G |
| C1-01I | Basic finish state | FINISHED presentation in `StudentRaceStatusView` | DONE — absorbed into D |

Merged-implementation notes (no letters were skipped):

- C was built as two internal slices (`useRacePlayerState`, then
  `getRaceView` + `useRaceBootstrap`); the official roadmap item stays C1-01C.
- F's responsibility is fully owned by the pure shared `getRaceView`
  resolver created during C — there is no separate F artifact on purpose.
- G and H shipped together as one integration step because H alone was a
  single route registration.
- I is the basic FINISHED status screen inside D's presentation — real
  results/ranking stay in C4 and the future server results contract.
- ERR was a supporting prerequisite discovered during A→D work, not a
  replacement for any letter.

Source-of-truth rules locked by C1-01:

- The server owns race status, player status, score, position, speed,
  difficulty and finish truth; the client never derives them.
- RacePlayer identity = HttpOnly cookie validated by the server per
  race-state request; JS never reads tokens.
- `sessionStorage` joinData is an optional display cache only (name, lane,
  cached counters); a missing cache never redirects, and race-state's
  `raceTitle`/`roomCode` win over it.
- Waiting polling is a temporary change-detection trigger; a future SSE
  event replaces the trigger, never the race-state truth.

Deliberately NOT in C1-01: real question loading, answer submission,
question timer, HUD, heartbeat/reconnect lifecycle, opponents, rank, final
results, hover-kart assets.

### C1-02 — Question panel and timer

**Status: DONE — E2E verified 2026-08-18** (real server question + choices +
deadline timer live against the local server: load, refresh-mid-question
without timer restart, expiry → single server resync → new question).

Capability delivered:

```text
view === PLAYING
→ POST current-question resolve (only then)
→ mapCurrentQuestionToModel (one DTO boundary, API_CONTRACT on malformed)
→ real question + choices in server displayOrder (ids kept for C1-03)
→ timer chip in the HUD safe area, derived from absolute expiresAt
→ deadline → lock + ONE latched refresh → server expires + generates next
```

Internal slices: A contract/duplication audit (server DTO verified — no
correctness leakage; expiry = the same POST resolve regenerates) · B DTO mapper
(`runtime/mapCurrentQuestionToModel`) · C controller
(`hooks/useStudentRaceQuestion` — reloadToken pattern, last-known question,
expiry latch) · D page integration (question enabled only for authoritative
PLAYING; both race-state and question errors feed the shared
RacePlayerSessionGate; a question CONFLICT triggers a one-shot race-state
resync so a race that ended mid-question routes to its status view) ·
E panel (`StudentRaceQuestionPanel` replaced the UI-10G shell, same geometry
contract) · F choice grid (semantic disabled buttons, answer-palette tokens
from tokens.css as decorative accents — never correctness; `onChoiceSelect`
contract ready, C1-03 only flips `interactionEnabled`) · G timer
(`StudentRaceQuestionTimer`, self-ticking so the page doesn't re-render per
tick; urgency thresholds in `studentRaceConfig.timer`) · H expiry sync
(latch per question+deadline; failure keeps the question locked) · I error
policy (panel-level errors keep the race world; no toasts) · J i18n keys in
the existing `studentRace` namespace, bdi-isolated math, mobile verified.

**C1-02K — Timing & concurrency hardening (DONE, 2026-08-18).** Closed the
gaps found in review before C1-03, after merging the latest `main`
(Diana's S0-02/S0-03) into the branch:

- Time contract: the question wire carries absolute Unix epoch ms —
  `expiresAtEpochMs` (deadline truth) + `serverTimeEpochMs` (server clock
  reference); the old zone-less `LocalDateTime expiresAt` and the client's
  `Date.parse` are gone. The mapper derives `serverClockOffsetMs`, and ONE
  shared formula (`runtime/questionTiming.js`) feeds both the timer chip
  and expiry scheduling — device timezone/clock skew cannot drift them.
  `SubmitAnswerResponse` was converted too (`answeredAtEpochMs`/
  `expiresAtEpochMs`) so C1-03 starts on a clean contract.
- Server time foundation: one `TimeConfig` (`QUIZWHEELZ_TIME_ZONE`, default
  Asia/Jerusalem) owns the shared Clock; Redis heartbeats now store epoch
  ms (S0-02 policy/TTLs unchanged; legacy ISO values fall back to durable
  state).
- Concurrency: current-question is POST on the same path (it can
  expire/create) and the delivery service locks the RacePlayer row
  (PESSIMISTIC_WRITE, same pattern as answer submission) BEFORE the
  ACTIVE-question lookup, building the QuestionPlan under the lock only
  when creation is needed — two near-simultaneous requests (StrictMode,
  double tab) can no longer create two ACTIVE questions.
- Question hook: strict single-flight (only the latest request clears the
  in-flight slot), busy refreshes coalesce into ONE trailing refresh (an
  expiry sync can never be lost), and the expiry latch is per question
  MODEL INSTANCE — a same-question-still-active response re-arms the
  deadline from fresh server timing instead of looping or locking forever.
- Conflicts: only semantic `RACE_PLAYER_NOT_RACING`/`RACE_NOT_IN_PROGRESS`
  trigger the one-shot race-state resync (`isRaceLifecycleConflictError`);
  generic 409s no longer do. Choice buttons additionally require a real
  `onChoiceSelect` callback before they can ever be enabled.

Deliberately NOT here: submitAnswer, selected-answer state, correctness,
feedback, snapshot application after answers (all C1-03); HUD stats (C1-04).

### C1-03 — Submit answer and snapshot mapping

**Status: DONE (2026-08-19).** The playable loop is real:

```text
select answer
→ lock all buttons immediately (single-flight ref)
→ submit selectedChoiceId
→ server correctness feedback shown immediately (✓ נכון! / ✕ כמעט!)
→ raceImpact.snapshot applied the same instant via applyRaceSnapshot
→ feedbackDelayMs dwell → refreshQuestion() → next question
```

Implementation notes:

- `runtime/mapSubmitAnswerToModel.js` — the submit boundary. Validates ONLY
  what the client consumes: response↔request identity, `correct`,
  correct-answer semantics (null on correct; on wrong the revealed id must
  belong to the submitted question's choices), snapshot presence. Unconsumed
  wire fields (questionStatus, timing echoes, deltas) join when a consumer
  exists (C1-04 HUD).
- `hooks/useStudentRaceAnswer.js` — answer lifecycle owner, separate from
  the question hook. Retains the submitted question MODEL INSTANCE for the
  whole feedback window (feedback can never paint onto the next question);
  staleness is DERIVED (dwell over + new question instance), so no reset
  effects exist. Never computes score/progress/speed/finish.
- `useRaceBootstrap` applies the latest answer snapshot over the race-state
  baseline through the SAME `applyRaceSnapshot`; since C1-03M freshness is
  ordered by `snapshotAtEpochMs`, and a fresher race-state poll supersedes a
  stale overlay automatically.
- Continuous Person-First motion: superseded by C1-03M below — position
  itself now advances continuously on the server, and the renderer predicts
  it between snapshots (the interim cosmetic `continuousWorldOffset` was
  retired to avoid double motion). Server side, race start sets
  `MIN_RACING_SPEED` + the movement anchor on the WAITING→RACING transition.
- Error policy: `QUESTION_EXPIRED` = time-up presentation + question resync
  (never "wrong", no snapshot); lifecycle conflicts + ambiguous
  transient/contract failures resync race-state + question — a POST is
  NEVER auto-resubmitted; session errors go through the existing gate.
  `QUESTION_EXPIRED` plus the stale-question names
  (`isStaleQuestionSubmissionError`, added in C1-03M) live in
  `serverErrorNames` for this branching.
- Finish: the final snapshot flips the view to FINISHED immediately; the
  page keeps the race screen visible for the feedback window
  (`isFeedbackDwellActive`) so the child sees the finish react, then the
  existing finished view takes over.
- `nextQuestionDelayMs` stays intentionally unused — one `feedbackDelayMs`
  dwell is the whole pause; stacking both would feel sluggish.

### C1-03M — Continuous authoritative movement hardening

**Status: DONE (2026-08-19, with server task S1-01A).** The gameplay-model
correction discovered after C1-03: authoritative `position` now advances
continuously with server time, so a race can never run forever.

```text
TIME x speed x BASE_MOVEMENT_UNITS_PER_SECOND  →  continuous position
ANSWER                                          →  speed boost/penalty
                                                   (+ progress bonus when correct)
```

Client side:

- `useRacePlayerState.silentRefresh()` — the shared polling-grade refresh
  (no isLoading flicker, single-flight); `useRaceBootstrap` polls race-state
  every `raceStatePollMs` (2s) while the view is PLAYING. This is gameplay
  truth sync, NOT the C1-05 heartbeat (presence/reconnect). The waiting
  flow's existing 2s poll now rides the same silent capability.
- Snapshot freshness: every snapshot carries `snapshotAtEpochMs`;
  `applyRaceSnapshot` ignores snapshots that are not strictly newer than the
  applied one — network arrival order can never roll authoritative state
  backward (replaces the C1-03 instance-keyed answer override).
- Renderer prediction: snapshots also carry the server-owned
  `movementUnitsPerSecond`; between snapshots `StudentRaceRenderer` advances
  a predicted target with it (drawing only — capped at totalDistance, the
  FINISHED transition remains server truth) and every new authoritative
  snapshot re-bases the prediction. `continuousWorldOffset` and
  `speedToPixelsPerSecondRatio` were retired; `positionToPixelsRatio` was
  retuned (30) so speed 1.0 still feels like ~120 px/s.
- Recovery fix from review: stale submitted-question errors
  (`QUESTION_NOT_ACTIVE`/`QUESTION_NOT_FOUND_FOR_PLAYER`/
  `QUESTION_CHOICE_NOT_FOUND`, `isStaleQuestionSubmissionError`) now trigger
  automatic question resync in the answer hook + the page's race resync —
  never an automatic re-POST.

E2E verified live (2026-08-19): a player who never touches the phone
advances (57.6→69.6 over 6s at the 0.5 floor), takes timeout penalties from
expired questions, and reaches the FINISHED screen with zero clicks; a
second player with NO client at all was settled and finished purely by the
server scheduler, and the race itself was finalized by the reconciliation
pass.

### C1-04 — HUD

**Status: NEXT**

Render only fields provided by the server:

- score
- streak
- timer
- progress
- speed/effect state
- rank only after S1-02.

### C1-05 — Presence/reconnect

**Status: PLANNED** — C1-01 deliberately created no heartbeat, reconnect,
online/offline or connection-state code; this task is the single future owner.

- heartbeat interval
- `visibilitychange`/page lifecycle policy
- explicit leave where appropriate
- reconnect on refresh/network recovery
- friendly session-expired state
- do not navigate based on local guess.

### C1-06 — Real asset pass and hover kart

**Status: PLANNED** — S1-01 closed the server-side presentation-identity gap:
race-state now carries the current RacePlayer's `racePlayerId`, `displayName`,
`laneNumber`, `vehicleTypeKey`, `vehicleColorKey` and `vehicleAssetKey`. C1-06 still
owns client consumption and refresh-safe vehicle rendering; it must use this server
truth, never `sessionStorage`.

- asset manifest keys
- metadata-driven props
- ONE composite monkey+hover-kart sprite per vehicle identity (LOCKED
  2026-08-19 — never body parts assembled in code; idle animation = 3-4
  complete aligned frames; see STUDENT_RACE_SCREEN_AND_ASSETS)
- correct/wrong/boost effects as separate Pixi overlays
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
