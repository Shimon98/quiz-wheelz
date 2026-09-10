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

**Local development milestone: CLOSED for progression to C2 — 2026-09-08.**
Shimon accepted the implemented single-player slice and requested C1 closure.
This checkpoint applies to `feature/C1-Student-playable-loop`, not an audited
merge into `main` or a production release. Live integration evidence from
2026-09-07 and the current automated checks are recorded below. Remaining
environment-specific verification is retained as required pre-release QA;
those unchecked items are not represented as passed.

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
  retuned to 30 world pixels per server unit. Speed 1.0 corresponds to
  4 server units/s and 120 world pixels/s; visible screen speed depends
  on the shared perspective and is not a fixed 120 screen pixels/s.
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

**Status: DONE (2026-08-19).** Compact presentation-only HUD in the existing
safe area — server truth in, pixels out:

```text
[RANK / PLAYER COUNT]   [SCORE]   [QUESTION TIMER]   [STREAK]
[progress ─────── %   ⚡ ×speed]
```

- `StudentRaceHud` grows around the existing `StudentRaceQuestionTimer`
  (still the ONE countdown); the overlay/screen pass the existing
  runtimeState down — no new store, polling or API.
- score/streak/speed render straight from `runtimeState.player`; progress is
  the one presentation-only derivation (`getRaceProgressRatio`:
  position/totalDistance clamped 0–100% for DRAWING only — the runtime keeps
  raw server truth, and a missing/non-positive totalDistance renders no bar,
  never a fake fallback distance).
- The 2026-09-07 revision renders authoritative `rank` and `playerCount`
  through the existing snapshot mapper; missing standing data is hidden,
  while malformed supplied data raises the existing contract error.
  The stopwatch presentation formats the same question deadline as
  minutes:seconds and caps its display to the question duration, avoiding
  an extra second when a question changes between display ticks.
  `getStudentRaceHudModel`, `getStudentRaceTimerModel` and
  `useStudentRaceQuestionTimer` keep formatting and timing outside JSX.
- Deliberately absent until its server contract exists: effect badge
  (the snapshot wire has no authoritative activeEffect field —
  contract gap reported for S1/gameplay), currentDifficulty (not core HUD).
- Seeded the client test foundation (Vitest + jsdom + React Testing Library,
  `npm run test`) with focused progress/HUD tests; the ongoing policy lives
  in TESTING_AND_DEFINITION_OF_DONE.

### C1-05 — Presence/reconnect

**Status: DONE (2026-08-19, live E2E verified).** One shared runtime-session
lifecycle owner, consumed by both the waiting page and the race page:

```text
route entry / browser online / hidden→visible / manual retry
  → POST reconnect (server resolves the lifecycle FIRST)
active outcome (RECONNECTED / WAITING_FOR_RACE)
  → CONNECTED + heartbeat every 15s (single-flight, online, visible)
terminal outcome (PLAYER_FINISHED / RACE_FINISHED / ALREADY_DISCONNECTED /
RECONNECT_WINDOW_EXPIRED — returned by reconnect, thrown by heartbeat)
  → heartbeat stops + race-state resync decides the final view
authoritative final view (FINISHED / CANCELLED / DISCONNECTED)
  → stopPresence(): heartbeat + automatic reconnect triggers stop
hidden document
  → heartbeat, race-state polling and question requests stop; answers lock
  → not gameplay-ready; movement freezes while question wall clock continues
visible return
  → reconnect first → authoritative resync → resume gameplay calls
transient failure while online+visible
  → ONE conservative 5s reconnect retry (no hot loop)
```

- `shared/racePlayer/useRacePlayerRuntimeSession` owns reconnect/heartbeat/
  retry/browser-event lifecycle; `mapRacePlayerReconnectToModel` is the DTO
  boundary (consumed fields only); cadences live in
  `racePlayerRuntimeSessionConfig` (15s heartbeat vs the server's 45s TTL).
- Initial gameplay is gated: race-state/question hooks mount only after the
  first reconnect resolution; after that the screen stays mounted through
  degraded periods — polling and question requests pause (`syncEnabled` /
  `questionEnabled`), answer interaction locks, and the shared
  `RacePlayerConnectionNotice` shows OFFLINE/RECONNECTING (healthy = no UI).
- Recovery reuses the existing owners: `resyncToken` →
  `useRacePlayerState.authoritativeResync()` (supersedes in-flight requests,
  latest wins); the question re-resolves via its own enable flip. Local
  browser OFFLINE never invents `DISCONNECTED`; reconnect-window expiry is
  terminal lifecycle (never a `/join` redirect); the authoritative
  DISCONNECTED view lost its misleading retry button.
- Race-state, current-question and answer errors are normalized by semantic name.
  `RACE_PLAYER_RECONNECT_REQUIRED` closes gameplay readiness and invokes the same
  runtime-session reconnect command; success advances `resyncToken` for the existing
  authoritative recovery path. It is distinct from terminal
  `RACE_PLAYER_RECONNECT_WINDOW_EXPIRED`, and an answer POST is never retried.
- **Leave is deliberately unwired**: no client wrapper, and nothing fires on
  refresh/unmount/pagehide/hidden — refresh must never equal quitting; a
  wrapper appears only with a real explicit "leave race" action.
- S1-01B visibility hardening gates both heartbeat cadence and
  `isGameplayConnectionReady` on `isDocumentVisible`; hidden→visible performs
  reconnect/resync before gameplay resumes and visibility is never sent as
  authoritative server truth.
- `runHeartbeat` performs a direct hidden-document early exit in addition to the
  interval gate, covering timer callbacks that were already queued.
- ACTIVE question identity and `expiresAt` survive hidden/reload/reconnect. The
  wall clock never pauses, overdue timeout applies exactly once, and visibility
  changes never request a replacement question by themselves.
- Focused tests cover the mapper, the full hook lifecycle (fake timers,
  StrictMode, single-flight, offline/online/visibility, retry, terminal
  outcomes, cleanup, no-leave), page-level session-first gating and the
  degraded interaction lock.

### C1-06 — Real asset pass and hover kart

**Status: IN PROGRESS (sliced A→G)** — S1-01 closed the server-side
presentation-identity gap: race-state now carries the current RacePlayer's
`racePlayerId`, `displayName`, `laneNumber`, `vehicleTypeKey`, `vehicleColorKey`
and `vehicleAssetKey`. C1-06 still owns client consumption and refresh-safe
vehicle rendering; it must use this server truth, never `sessionStorage`.

- **C1-06A — presentation identity consumption — DONE.**
  `mapRaceStateToRuntime` validates and maps `race-state.player` into
  `runtimeState.player` (keys stay opaque strings — no client enum copy);
  `applyRaceSnapshot`'s player spread preserves identity across snapshots.
- **C1-06B — asset manifest/loader/resolver — DONE.**
  `pixi/assets/studentRaceVehicleManifest.js` maps `vehicleAssetKey` → client
  art (explicit entries; never path construction from the server key);
  `studentRaceVehicleAssets.js` resolves one key and loads ONLY that vehicle's
  `idleFrames` (1 frame now, the 4-frame idle set later, same loader).
  Unknown/malformed/unloadable art → explicit fallback result — C1-06C keeps
  the existing Graphics placeholder, never another vehicle's art. Production
  manifest stays empty until the approved GREEN MASTER lands.
- **C1-06C — integrate the approved GREEN MASTER static sprite — DONE
  (2026-08-23).** `runtimeState.player.vehicleAssetKey` flows from
  `StudentRaceRenderer.updateRuntimeState` (never per frame) into
  `PlayerKartLayer`'s async art lifecycle — same-key loads dedupe, stale and
  post-destroy results never apply, fallbacks keep the Graphics placeholder.
  The real art lives at `assets/game/studentRace/hoverKarts/` (WebP, the
  master center-cropped to 1046px and scaled to 768px — every later idle
  frame must use the same box); `TOY_CAR_GREEN` is the first manifest entry
  (anchor 0.5/0.96, baseScale 1.08). A successful load shows exactly one
  static `Sprite` inside the bobbed kart container (placeholder hidden, not
  removed); any fallback destroys the sprite and shows the placeholder again.
  Textures stay owned by the Pixi Assets cache. Calibrated on 360×640,
  390×844, 520×800 and desktop; the dev preview runtime carries the key so
  `/dev/race` shows the real art. Server fact: colors are lane-driven
  (lane 1 PURPLE, 2 RED, 3 BLUE, 4 GREEN …); interim decision 2026-09-05:
  every server color key maps to the GREEN master until per-color art lands
  (deterministic hue-shifted candidates for the other seven exist as a
  preview).
- **C1-06D — character idle animation — DEFERRED (optional polish,
  2026-08-23).** Static GREEN MASTER retained. Experimental full-frame and
  tail-layer idle loops were not accepted visually and are not part of the
  production implementation. Player art currently uses the approved static
  composite asset plus Pixi bob/tilt; character-part animation may be
  revisited as optional polish after the core race presentation is complete.
  Not a blocker for the C1 gate.
- **C1-06E — server-driven correct/wrong/boost/finish visual feedback —
  DONE (2026-08-23).** Procedural Pixi one-shots in `EffectsLayer` (no image
  assets, no text), each owned by one authoritative source:
  CORRECT/WRONG ← the accepted submit-answer feedback state only
  (`StudentRaceScreen` memoizes a presentation runtime whose
  `visual.activeEffect` comes from `resolveStudentRaceFeedbackEffect`;
  IDLE/EXPIRED/ERROR and a finished player map to null, so a
  reconnect-required or failed POST never draws correctness); BOOST ← the
  authoritative `visual.targetSpeed` rising between runtime samples (first
  sample remembers only, equal/lower never fires, no copied server rule);
  FINISH ← `playerFinished` false→true only (never position/totalDistance),
  dominant: it clears shorter one-shots and blocks new ones while playing.
  `detectRuntimeEffectTriggers` (pure) spots the edges inside the layer's
  `update(frameState)`; effects age on `deltaMs` with the existing
  `raceAnimationConfig.effects` durations (700/500/900/1200 ms); geometry is
  deterministic (fixed angle arrays); BOOST streaks clamp to the visible
  world bottom so phones keep them above the panel. Pixi ticker owns effect
  timing/drawing; React only supplies runtime changes; the server stays the
  gameplay truth. Live E2E (8081): correct → CORRECT+BOOST (0.5→0.7), wrong →
  WRONG only (0.7→0.5); poll-driven finish → FINISH during a held screen,
  then the final view. Real vehicle art is blank while an approved asset
  loads; the Graphics fallback appears only after a definitive asset
  fallback result (unknown key / malformed entry / load failure), preventing
  refresh-time placeholder flashes — the master fades in over 120 ms on the
  frame clock. The race canvas is retained for the authoritative finish
  presentation window (`useStudentRaceFinishMoment`, PLAYING→FINISHED,
  `finishEffectDurationMs`, composed with the answer dwell, no remount) so
  the FINISH one-shot completes before the final status view.
  The 2026-09-07 presentation revision adds a React `StudentRaceReward`,
  a server-streak combo chip and a compact `StudentRaceSpeedometer`.
  `mapSubmitAnswerToModel` provides accepted feedback;
  `useStudentRaceAnswer` owns its question identity and existing dwell;
  the shared `assertValidRaceSnapshot` validates the answer snapshot before
  feedback is exposed. The submitted question remains the feedback model
  even when a background refresh supplies the next question.
  `getStudentRaceHudModel` formats server streak/score delta and prepares
  the reward. No local combo/scoring rule is added. Pixi answer events
  deduplicate by question ID through `detectRuntimeEffectTriggers`;
  `drawFeedbackEffect` and `raceFeedbackVisualConfig` own correct/combo
  geometry. The speedometer's pure model formats raw server speed as ×N.N
  and maps `speed / (speed + 1)` to a cosmetic dial, without a server cap
  or invented units. JSX presents these models; CSS follows the existing
  theme and CSS/Pixi honor reduced motion. The new revision still passes through G.
- **C1-06F — world / road / jungle / depth / movement polish — IN
  PROGRESS (accepted presentation; F-9/G QA open).** Locked world model: static FAR horizon art; projected surfaces
  (road, ground and optional low MID verge) scroll in `worldOffset` lockstep — the
  shared reciprocal distance projection makes far slow and near fast, so movement
  multipliers belong only to future screen-space layers (NEAR ≈ 0.85);
  `viewDepthZones` stays untouched (opponent contract). Art values live in
  `worldArtConfig`; existing raw generator art is processed deterministically
  (script beside the sources) into `assets/game/studentRace/`. The new
  thicket and flowering verge are packaged as lossless WebP; their generated
  PNGs stay private.
  - **C1-06F-0 — foundation — DONE (2026-08-24).** `worldArtConfig` (FAR
    placement + road tileWorldLength 960/meshRows/underPanelColor),
    `studentRaceWorldAssets` loader (Assets.load, repeat/mipmap opts, never
    rejects), processing script (FAR: alpha lift + bottom feather only when
    the source bottom is not already transparent; ROAD: brightness de-drift
    and half-roll + 24 px cross-fade seam heal only when measured necessary;
    wrap seam measures like interior rows).
  - **C1-06F-1 — SKY backdrop + FAR horizon — ACCEPTED (current world,
    2026-09-07; integrated 2026-09-05).** Static sprite anchored by
    `horizonAnchorYRatio` (0.86 for the V2 panorama, valley floor across the
    horizon line) to `perspective.horizonY`,
    1.22× frame width with
    the valley opening (0.5 of source) aligned to the vanishing point
    (`resolveFarHorizonPlacement`); static sky gradient above the horizon
    and a receding ground gradient below it (`worldArtConfig.sky`/`ground`,
    strip Graphics rebuilt only per canvas size, no clock, no assets); legacy
    treelines/haze/bush rings draw only in the fallback path.
  - **C1-06F-2 — ROAD mesh (V1 art) — DONE.** Flat top-down road+shoulders texture through
    a 24-row `Mesh` built from THE existing projection
    (`buildRoadMeshData` — PerspectiveMesh homography would not match the
    quadratic depth mapping), texture v scrolled by
    `getLoopPhase(worldOffset, tileWorldLength)`, repeat wrap + mipmaps on
    the source, under-panel fill in the sampled road color; Graphics
    road/curbs/mud remain only as load fallback. Wrap QA: phase 0.999 vs
    0.001 differ by mean 0.18/255, zero px > 40.
  - **C1-06F-2 — final ROAD V2 asset — ACCEPTED (current world,
    2026-09-07; integrated 2026-09-05).**
    682×2048 calm loop with baked green shoulder strips;
    `tileWorldLength` now 960 with reciprocal sampling (F-8); road and kart widths derive
    from a width unit = min(frame width, `camera.widthUnitWorldHeightRatio`
    0.7 × visible world height), so wide frames keep phone proportions, show
    more world at the sides and keep the texel aspect constant; road-width
    exponent back to 2 (1.7 bent the edges into a bowl — the "fold" seen on
    wide frames); now a 48×8 grid mesh (columns remove the
    affine texture warp of wide trapezoid rows); 16× anisotropic filtering
    for the far rows; road-top ratio 0.09; horizon haze became a localized
    nested-ellipse mist at the vanishing point (`horizonHaze.radiusXRatio`)
    instead of a full-width band. The 2026-09-07 revision sets
    `worldArtConfig.road.surfaceInsetURatio` to 0.12: `buildRoadMeshData`
    reuses the strip's horizontal sampling hook to read U 0.12–0.88,
    omitting the flat green strips and widening the visible mud. The source
    image and road silhouette are unchanged; inverse-distance V sampling and
    repeat lengths follow F-8, while separate projected verge leaves soften
    the boundary.
    `edgeFeatherHalfWidthRatio` 0.04 adds a soft alpha transition over the
    outer 4% of each road half-width (2% of full road width per edge).
    This is an opt-in extension of `ProjectedTextureStrip`, with
    `createStripEdgeShader` composing Pixi's public shader bits. Its edge
    coordinates are independent of cropped/scrolled texture coordinates;
    ground and MID retain their default strip behavior. Teardown releases
    the strip's geometry buffers and shader while retaining cached textures.
  - **C1-06F-3 — MID roadside base — OPTIONAL / DISABLED (2026-09-07).**
    `MidBaseLayer`: two projected low-vegetation strips (art
    `jungle-mid-base`, 2048×768 → 2024×768 after the horizontal crossfade
    heal, top 56% transparent) built by the shared
    `buildProjectedStripMeshData` (now also under `buildRoadMeshData`), feet
    3% inside the road edges under the baked grass shoulder, height 0.55 ×
    road half-width, right strip mirrored + 0.37 phase offset, `worldOffset`
    lockstep, repeat + mipmaps + 16× anisotropy (`worldArtConfig.midBase`).
    Surface layer containers keep the road/MID order stable across async
    loads. Scenery sprites and the upright finish gate now share their
    parent world's depth sort, so foliage can pass behind and in front of
    the gate. Demoted 2026-09-07: next to the projected
    ground and scenery props the strip read as a green rail, so
    `worldArtConfig.midBase.enabled` is false by default (kept as an
    optional low verge).
  - **C1-06F-3A — projected side ground — ACCEPTED (2026-09-07).**
    ONE seamless top-down jungle-floor tile
    (`jungle-ground`, 1024², measured seamless on both axes) projected as a
    full-width ground plane under the road inside `JungleLayer`, below the
    FAR sprite so its mist dissolves into the floor: `buildGroundMeshData`
    distributes `tilesPerRoadWidth` tiles per road width at every depth.
    The 2026-09-07 tuning raises this value from 0.45 to 0.65, reducing
    near-ground horizontal stretch from about 2.05:1 to 1.42:1 on the
    736×800 reference frame. Ground mesh rows increase from 24 to 48
    to reduce piecewise projection coarseness. F-8 also uses 48 road rows and
    calibrates inverse-distance surface sampling. Texture v still scrolls in
    `worldOffset` lockstep, and a static
    pixel-snapped distance-mist fade (`ground.mist*`) sits above it. The
    mesh plumbing shared by road, verge and ground is ONE class,
    `ProjectedTextureStrip`.
  - **C1-06F-4/5/6 — scenery props: foundation + trees + rocks/bush — ACCEPTED
    (current world, 2026-09-07).**
    `SceneryLayer` retains one sprite owner for every scenery asset.
    `sceneryConfig` defines six composition bands: rear thicket, canopy,
    trees, undergrowth, rocks and low verge foliage. `buildSceneryPlacements`
    generates 588 stable placements once over per-band 2400–4800 world-px loops,
    with staggered spacing, different left/right phases, varied scale and
    lateral distance. Per side: 44 thickets, 32 canopy trees, 28 trees,
    44 undergrowth props, 18 rocks and 128 verge plants. Eight WebPs include
    a transparent rear thicket filling gaps behind individual trunks and
    a new low flowering verge clump. Gradual per-band entry opacity connects
    the foliage to the existing FAR. About one third of verge placements use
    flowers; the undergrowth band also mixes this asset with existing plants.
    Its 1774×887 lossless RGBA WebP is 1,344,364 bytes; `anchorY` 0.94
    positions the dense base without cropping or altering the artwork.
    The lossless runtime assets, private generated PNGs and exact prompts are recorded in
    `STUDENT_RACE_SCREEN_AND_ASSETS.md`; this composition adds no separate
    scenery renderer or per-frame randomness.
    `projectSceneryPlacement` uses THE track projection, now owned by
    `createRacePerspective`, and sizes each
    sprite from road half-width, asset width and placement scale. Full
    sprite widths constrain tree crowns outside the road; low foliage
    may cover the outer 26% of a road half-width to conceal the sharp
    shoulder join. Ground anchors come from prop metadata; all sprites and
    the finish gate share world-container depth sorting. `SceneryLayer`
    owns and destroys only its sprites, retaining the shared parent.
    Bounds culling retains partially visible crowns even when their
    anchors leave the frame. Road geometry, width, camera and logical
    depth-zone thresholds remain unchanged for future C2 opponents. Reciprocal
    distance mapping and its inverse now belong to `createRacePerspective`;
    road/ground/MID texture sampling and Graphics fallbacks share that mapping.
    Road and ground use 48×8 meshes with 960/710-world-pixel repeats. Per-band
    spacing preserves dense near foliage; signed repeat windows recycle only
    after full bounds exit and fade new instances into the distance.
  - **C1-06F-7 — NEAR scenery continuity — ACCEPTED (2026-09-07).** The same
    projected props continue beyond the old 0.78/0.80 cutoffs through the
    near zone. Scenery opts into a signed exit tail through the same
    projection beyond depth 1; its base can continue behind the panel
    while its crown remains visible. It is culled only after its full
    bounds leave the viewport, with no fade at the visible-world boundary.
    The ordinary projection window stays unchanged for track objects.
    Kart/effects/React overlay retain their foreground ownership. A separate
    screen-space foliage strip remains optional future art.
  - **C1-06F-8 — world/motion polish — IMPLEMENTED / ACCEPTED (2026-09-07;
    final integration/performance verification in F-9/G).**
    `studentRaceMotion` owns renderer prediction, server-rate movement and
    bounded smooth snapshot correction; `raceAnimationConfig.motion` owns
    its tuning. Base velocity follows server-rate changes over 400 ms.
    Correction velocity uses a 2800 ms error horizon and 700 ms response;
    their sum advances one visual position. The first EASY-sized fixture
    (2→2.8 units/s, +10 position) peaks at about 5.48 units/s instead of
    7.41 before this refinement and then settles to 2.8. Repeated +20 samples
    every 0.9 seconds retain continuous motion with about 73 units of bounded
    backlog in the stress test. Genuine sustained server rates remain intact:
    initial speed 0.5 gives 2 units/s and maximum speed 2 gives 8 units/s;
    no server code or rules changed. Finish settling presents the authoritative
    finish flag and shares `raceAnimationConfig.effects.finishEffectDurationMs`
    (1200 ms) with the existing effect; there is no second finish-duration
    owner or client finish decision. DEV movement uses
    `4 × speed` and `/dev/race?motionScenario=boost` supplies synthetic
    one +10 position/+0.2 speed sample after five seconds, starting from
    speed 0.5 and holding speed 0.7 afterward for sustained-motion checks.
    `/dev/race?motionScenario=finish` begins at position 900
    for about 21 seconds of gate approach at 4.8 units/s. The explicitly
    labeled DEV preview now has four clickable fixed feedback fixtures:
    correct, streak 3, streak 5 and wrong. Each uses a unique question ID,
    the production answer mapper and the existing 900 ms dwell. Sample
    score/streak values belong only to that harness; no rank/count is invented.
    Production rank/count already use supplied server snapshots. HUD colors
    now follow existing light/dark/system tokens without a theme override.
    The upright finish gate uses poles and a checkered banner drawn once
    with Pixi Graphics, scales with THE track projection and interleaves
    with scenery by projected depth. It contains no baked text or finish
    decision. Kart `maxWidthRatio` is now 0.34 (from 0.28), keeping its
    center, anchor and track geometry. The renderer reveals its scene after
    layer readiness settles; rejected assets use their existing fallback.
    Pending loads also fall back at the 10-second deadline in `worldArtConfig.loading`.
    Timers are cleared and late results cannot mutate textures.
    Destruction before readiness cannot reveal a stale scene.
    No calculations were added to JSX. Shimon accepted the current world
    presentation; retain it while completing the feedback/speedometer pass.
    Additional shadows/dust or separate NEAR art are optional polish,
    not a reason to reopen the accepted composition.
  - **C1-06F-9 — local checkpoint accepted; remaining release QA tracked**
    (C1-06G). Validation rerun on 2026-09-08: 402 client tests across
    49 files, ESLint and the production build pass. The known main-chunk
    warning remains (899.70 kB; race chunk 271.17 kB). Built JavaScript has
    no local-runtime, preview, motion-scenario or DEV-race identifiers. DEV browser checks
    at widths 320, 375, 412, 768, 1024 (short frame) and 1280 found no
    horizontal overflow and all four answers fit. Preview controls exercised
    the combo reward and Pixi burst; missing rank stayed hidden. Light
    English/LTR and system-dark Hebrew/RTL were inspected. Reduced motion
    has unit/CSS coverage, with browser verification still open. Earlier world
    checks covered gate/foliage depth and theme switching; automated coverage
    includes reciprocal optical flow, texture/prop agreement, signed repeat
    exits and sustained server movement.
    Live API/browser QA on 2026-09-07 used an isolated two-player race: create/join/start, six
    correct/wrong answers including streak 3, reconnect with persistent
    speed 0.9, then normal finishes at distance 100 with ranks 1/2 and zero
    movement rate. Score/streak remained authoritative through finish.
    Real browser QA covered join/wait/start, correct +10 and speed 0.7,
    actual expiry/question reset, then consecutive correct answers showing
    score 50, streak 2, COMBO +10, speed 0.9 and rank 1/2. Reload near 94%
    returned FINISHED. That is not a mid-race offline/resume browser test:
    current offline and hidden→visible recovery, reduced-motion emulation
    and physical-phone QA remain open. Opponents remain C2.

- asset manifest keys
- metadata-driven props
- ONE composite monkey+hover-kart sprite per vehicle identity (LOCKED
  2026-08-19 — never body parts assembled in code; idle animation = 3-4
  complete aligned frames; see STUDENT_RACE_SCREEN_AND_ASSETS)
- correct/wrong/boost/finish effects as separate Pixi overlays (C1-06E)
- no wheel animation.

**C1 gate:** complete real single-player race flow including refresh/reconnect.

C1-06G local development closure checklist:

- [x] Current world, road/forest joins and movement presentation accepted by Shimon.
- [x] Server-driven reward/combo and speedometer implemented with separate
  JavaScript view models and existing React/Pixi ownership.
- [x] Current tests (402/49), lint/build, production DEV exclusion and
  narrow/short/wide DEV checks pass;
  four answers fit, combo/Pixi feedback works, and light English/LTR plus
  system-dark Hebrew/RTL were inspected.
- [x] Live API create/join/start, repeated correct/wrong answers, reconnect
  and normal finish retain server-owned score/streak/speed/rank.
- [x] Real browser join/wait/start, correct/combo HUD, actual expiry/reset
  and near-finish reload into FINISHED verified.
- [x] Automated page/session recovery checks pass: hidden state pauses
  gameplay/heartbeat, visible return reconnects before resync, and a failed
  answer is never automatically posted again.
- [x] `StudentRaceScreen` integration with the actual Mantine media-query
  hook preserves written feedback and authoritative state, forwards the
  initial/live reduced-motion preference to Pixi, and clears feedback after dwell.

Required pre-release QA carried forward from C1 (not blocking the accepted
local development handoff to C2; not yet verified on a physical device/browser):

- [ ] Verify current browser offline/reconnect and hidden→visible recovery
  during a race without answer replay or stale feedback.
- [ ] Verify reduced-motion browser emulation; current coverage is unit/CSS only.
- [ ] Verify touch/readability and sustained rendering on a physical phone;
  record the device and result before claiming performance completion.

## C2 — Opponents

Next implementation stage after the accepted local C1 checkpoint. Server S1-02 and
C2-01 are DONE: race-state, answer and finish-arbitration snapshots provide
authoritative `rank`, `playerCount`, `eventVersion`, `positionAtEpochMs`,
`playerFinishedAtEpochMs` and the full `opponents` roster (every other joined
player, 0..7, standing order; each with `rank`, `position`, `positionAtEpochMs`,
`movementUnitsPerSecond`, `status`, `finishedAtEpochMs` and lane/vehicle identity
incl. `vehicleAssetKey`). `POST /api/race-players/me/finish-arbitration` returns the
same snapshot plus the confirmed finish-order prefix. The HUD consumes rank/count;
opponent mapping and rendering are locally implemented in C2-02/C2-03 (2026-09-10),
pending adversarial pre-commit review and live browser/device QA. No client-calculated
rank is needed. One snapshot accumulator orders by `(eventVersion, snapshotAtEpochMs)`;
student SSE invalidates with mutation/generation guards and existing polling fallback.
C2-04 is locally implemented (2026-09-11): passive finish synchronization,
ETA/opponent arbitration triggers, ordered proof-gated crossing and shared visual
runout. Direct FINISHED reloads do not replay a crossing. Fifteen focused tests
were added; live multiplayer/browser/device QA remains open before C2 acceptance.

- validate/map `opponents` snapshots through the existing runtime boundary,
  retaining snapshot freshness (`snapshotAtEpochMs`, `eventVersion`,
  per-opponent `positionAtEpochMs`) and each player's server identity/state
- derive `laneDelta` from server lane numbers for the existing projection's
  lateral coordinate; retain Depth Lock and the accepted road/camera/depth zones
- opponent interpolation keyed by RacePlayer ID
- hidden/entering/visible/exiting state machine
- hysteresis/fades
- bounded prediction (2.5 seconds), shared calibrated perspective and full-bounds culling
- object pooling
- server color keys
- no visual depth cheating.

Player/opponents share `StudentRaceVehicleVisual` and the existing asset loader;
pooled opponent roots interleave with scenery directly in the world container.

### C2-A — Race sound polish — PLANNED

Next near-term polish slice after the first integrated opponent renderer,
before the student-side final demonstration. No sound playback or assets
are implemented by this planning checkpoint.

- A quiet hover-engine loop changes pitch/volume gradually with the real
  server speed and remains at the new level while that speed is sustained.
- Short distinct sounds for accepted correct/wrong answers, combo, boost
  and finish; optional subtle jungle ambience below the feedback volume.
- Reuse accepted answer identity/streak and authoritative speed/finish
  transitions. A combo sound is presentation of the server streak, never
  a locally calculated reward or a new game event.
- One feature audio controller owns playback and cleanup outside JSX and
  outside Pixi drawing code. Reuse the existing feedback contract and
  lifecycle; do not create another polling loop or gameplay clock.
- Audio metadata belongs to focused manifest/config keys. Load bounded
  assets with a silent fallback so sound failure cannot block the race.
- Reuse existing settings/theme/i18n owners for mute and volume, with an
  obvious reachable mute control. Begin playback after user interaction;
  the game remains fully usable with sound off or browser playback blocked.
- Pause engine/ambience when hidden or gameplay is unavailable; resume only
  after the existing session recovery is ready. Do not replay old answer or
  finish sounds on refresh/reconnect. Stop and release audio on unmount.
- Acceptance: mobile playback, mute persistence, no doubled sounds after
  repeated answers/reconnect, sustained speed changes, and comfortable
  balance with classroom use. Retest the carried-forward device checklist.

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
