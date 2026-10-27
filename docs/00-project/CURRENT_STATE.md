# Project Current State

**Status:** Canonical  
**Audit date:** 2026-09-20
**Code baseline:** `main@b577a3b3b63142980cfdccb057d89311ce3d85a6`
**This document owns:** the audited implementation status across the complete product

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Audit boundary

The recorded baseline is the merged `main` used to start the S3-02 audit. The S3-02
changes documented below are the milestone changes measured relative to that
baseline.

Local client checkpoint, 2026-09-08: C1 development is accepted for
progression to C2 on `feature/C1-Student-playable-loop`. The single-player
world, HUD, accepted-answer/combo feedback and real server flow are implemented.
402 client tests/49 files, lint and build pass. This does not update the
audited `main` baseline or claim a production release. Remaining browser/device
QA and near-term audio polish are tracked in the canonical client plan.

Repository checkpoint, 2026-09-20: C2 competition truth, synchronization, opponents
and proof-gated finish presentation merged through PR #68. C3 Teacher Live route,
initial/recovery state, durable SSE synchronization and projector UI foundation
merged through PR #69. Physical-device acceptance and C2-A race sound remain open
polish; the C4 Result Screen remains future client work.

C3 checkpoint, 2026-09-24: the teacher live race is COMPLETE on the client. C3-01
(live route and authoritative live-state), C3-02 (durable teacher SSE sync with version
gating and authoritative recovery) and the C3-00 server lifecycle epochs were merged to
`main` in PR #69 (`95fb9f5`, 2026-09-15). C3-03 (projector UI: track, leaderboard, live
feed, server-clock elapsed time, responsive layouts, fullscreen, advisory device notice,
finished presentation) and C3-04 (eight production side-view vehicles with a
Teacher-specific manifest and fallback, single-source responsive geometry, leaderboard
density, brand stability) and C3-05 … C3-08 (real jungle projector art, UI art accents
and title plaque, animated authoritative leaderboard with podium tiers and medals,
waiting-room art preload, live-route workspace navigation) are DONE. Release QA items
needing a live backend and a real browser: an overtake observed with bots, fullscreen →
Esc → fullscreen, reconnect without replayed pulses, phone rotation inside the
workspace shell. C4 Results is next and consumes the S3-01 final-results read model.

C4 checkpoint, 2026-09-29: Results are COMPLETE on the client (`feature/C4-results`).
C4-A: the teacher Result Screen at `/teacher/races/:raceId/results` reads the S3-01 model
once, keeps the server order, ranks, winners and awards untouched, and is reached from
the dashboard, All Races and an explicit link on the finished projector. C4-B1/C4-B2: on
the same `/student/race` route a finished student watches the race (WATCHING) and then
sees the final standings (FINAL), with the student EventSource kept open as a passive
watcher, heartbeat stopped, a 5-second fallback poll and staggered finish-proof requests.
C4-C: shared results art (front hero karts on a podium, medals, a neutral placement badge,
award emblems, title plaque) and per-name bidi isolation in teacher results. Live review
covered teacher results (race 131) and student results (bot races 133/136/137), and the
final build passed live closure QA on 2026-09-30 (bot races 138–140 with a real student
and a real teacher browser). Next: Phase 4, starting with the S4-01 effect/event contract
that C5 consumes.

C5 checkpoint, 2026-10-07: S4-01 (gameplay/effect foundation, PR #74) and C5-A audio (race and
projector music and sounds with Music/Sound effects settings, PR #75) are merged. C5-01, on
`feature/C5-01-gameplay-runtime`, makes the student client consume the S4-01 contract: the
server's effective speed drives the speedometer, the engine sound and the kart's visual speed,
movement stays server-owned, and unknown future modes or effects are ignored safely.

C5 checkpoint, 2026-10-17: C5-01 (PR #76), the S4-02/S4-03 Challenge contract (PR #77) and the
C5 Track A presentation groundwork (PR #78) are merged. C5-02, the student Challenge choice
and energy meter, is committed locally on `feature/C5-02-challenge-choice-energy` (`f6b9878`,
not pushed): the student sees the server's offer as two cards with one
countdown, a lost or failed choice is checked against fresh race state instead of being
guessed or re-sent, and live QA passed on the local server (races 156–158). The rest of C5-03 —
Safe progress, one-shot Turbo/Safe results and the kart thrusters — is implemented on the same
branch (not committed, pending review); live QA passed on the local server (race 161 and the
eight-player soak race 162). 2026-10-18 closeout on the same branch (not committed): the
monkey poses (Safe lounging with a banana can, Turbo leaning forward) are composited onto the
shipped kart bodies for all eight colours; challenge answers no longer present a combo; the
Safe Perfect effect no longer covers the kart; a lost answer acknowledgement is proven not to
re-send or double-score; the seven colour karts load about 2 MB lighter. Earlier live QA
(race 172) predates the final visual repairs.

Local checkpoint, **C5-03k, 2026-10-18**: selecting Turbo leaves the idle pose and blue
painted nozzles throughout the question. Only a fresh server `TURBO_SUCCESS` result moment
starts the short painted flame and launch pose. Ordinary correct answers, failure, refresh and
polling do not trigger a launch. Removed the special 110 units/s catch-up and camera zoom;
the +80 progress reward uses the shared normal interpolation (24 units/s correction cap).
Safe and success-pose transitions use a 320 ms whole-composite blend on an isolated Pixi
surface, with no squash and no transparent body dip. Safe ground-light alpha is 0.18.
No server contract or reward changes. Claude's interrupted seven-file attempt was reverted:
all 94 scoped paths matched the preceding delivered bundle before this repair.

Local checkpoint, **C5-03l, 2026-10-18**: Safe Complete and Safe Perfect now use
one shallow blue ground ripple and a contained blue nozzle pulse. Removed Safe stars, golden
rays and driver-height rings; no Safe flame. The steady light is softened, result pulses ease
in/out, and mode aura fades over the same 320 ms as the pose. Turbo success gating and normal
motion remain intact. Local before/after evidence covers both Safe outcomes.

Local checkpoint, **C5-03m, 2026-10-18**: pose blending inherits the renderer's
resolution/antialiasing and Turbo returns to idle in 160 ms (Safe remains 320 ms). Active
server challenge slowdown dims the nozzles and adds an amber speedometer label plus a
compact, playful notice. No local speed penalty or duration is invented. Existing audio
is preserved; additional mode music is deferred by the user's latest priority.

C5-03 status, **final gate, 2026-10-18**: implemented and tested on
`feature/C5-02-challenge-choice-energy` and merged to `main` with the C5 client PR (checkpoint
below). The final code passed a live
race on the local server, race 190: 39/39 (Turbo win and failure, a missed offer, Safe Perfect
with a reload mid-run, Safe Complete, a lost answer acknowledgement with one POST and the
server's score). Race 183 (pose and exhaust images blocked) passed 12/12 and race 180 (reduced
motion) 11/12 — the one mismatch is an expected development-only warning from the animation
library, not a game failure. The gate also removed a 64–177 ms stall at the first Turbo win: the
pose-blend filter compiled its shader on first use and is now warmed up in a quiet moment.
Performance was measured on the DEV build only; a physical-phone check and production profiling
remain open, and dedicated challenge sounds are still audio work.

C5 checkpoint, 2026-10-24: C5-02, C5-03 and client quality packages 1–3 (GPU residency of the
challenge art, challenge sounds and calm student results music, browser storage, self-hosted
fonts and the hover-kart entry art) are merged to `main` with the C5 client PR from
`feature/C5-02-challenge-choice-energy` (`f6b9878` … `863a2e3`); 1,689 client tests, lint and
build pass. The S4-04 server work (Guard Shield and fair Luck) reached `main` at `77cd396` with
the Luck flag off by default; its integration-readiness review is pending
(`../01-server/SERVER_IMPLEMENTATION_PLAN.md`). The client does not read the new
`gameplay.powerUps` and `gameplay.luck` fields yet.

S4-04 checkpoint, 2026-10-24: the review reproduced four Luck-ON defects on `main` (a deadlock
between two races drawing speed events together, a nightly question cleanup blocked by Luck and
focus references, Luck ON without a declared connection budget failing every answer, and a
no-op Tailwind at the maximum speed). The S4-04 stability fixes change no game rule and keep
Luck OFF by default. A question audit also found that Turbo always drew the first HARD template
(two-number addition up to 12) and Safe's third question was multiplication up to 10×10. By
Shimon's 2026-10-24 decision Turbo now draws one of five multi-step HARD templates (order of
operations, parentheses, a short multiplication chain) and Safe draws addition and subtraction
up to 10, each generated from exactly the selected template; the 15-second limit and rewards are
unchanged.

Checkpoint, 2026-10-25: the S4-04 stability fixes (PR #80) and the S4-03 template safety with
C5-04 part 1 (PR #81, `main@5ed8a39`) are merged. On `feature/S4-05-C5-04-recovery-luck-shield`
(local, not merged): S4-05 Hidden Recovery on the server, behind its own flag and OFF by default
(a player who is both behind and struggling gets +10 Challenge Energy once, hidden from every
API), and C5-04 part 2 on the client (the Guard Shield, Tailwind, Energy Orb, Mud and a shield
block shown with temporary Pixi `Graphics` and text notices, no new art or sound). Server
maintenance in the same branch: unexpected 500s are logged with their stack trace and no
generated Spring password is created any more. Luck and Recovery stay OFF by default. An
independent review (2026-10-26) was answered on the same branch: one-shot Luck news is never
retold after a refresh, the shield is announced to screen readers, every Luck type is proven on
snapshots the server wrote, and an unrecognized I/O failure on a started response leaves one
WARN line. Recovery stays OFF until Diana approves two rules in writing (a finished leader is
not part of the field; a STRICT focus forfeit counts as a failure), its DDL is applied before
deployment and a p50/p95 measurement passes (see the S4-05 section of the server plan).

Next: review and merge of that branch, the final Luck and Guard Shield art and sound, a
physical-phone check (before classroom or production use) and client quality package 4. Diana owns the requested Turbo question sequence and question difficulty on
the server; the client does not simulate these. Browser fixtures and unit tests are local
evidence, not release acceptance. C5-03 review bundle:
`docs/vision/C5_03/codex_clarity_2026-10-18/` (local, ignored).


## Executive summary

QuizWheelz is not an early prototype. Most backend gameplay foundations and the
teacher/student pre-race client flows exist, and the core student race loop is
playable against the server (question → answer → feedback → authoritative
snapshot → next question), with presence-bounded continuous
server-authoritative movement (C1-03M/S1-01B) and hardened repeat-action semantics
(S1-03): connected students advance
with time, correct answers boost speed and add progress bonuses, and timeouts
slow more than wrong answers. Real absence freezes position without pausing
question deadlines; reconnect never awards offline catch-up, and absent
players do not keep the class race open. C2 multiplayer competition and C3 Teacher
Live are implemented: C3-01/C3-02 merged in PR #69 and C3-03 … C3-08 are complete on
the client. The server final-results read model is implemented by S3-01 and the C4
teacher Result Screen and student progressive results are complete on the client; the
next stage is Phase 4 (server S4 game events, then the C5 gameplay UI).

## Product status board

| Area | Server | Client | Overall |
|---|---|---|---|
| Teacher login/logout/current user | DONE | DONE | DONE |
| Teacher registration | PLANNED | PARTIAL UI | REQUIRED LATER |
| Email verification/reset/2FA | PLANNED | PARTIAL UI | REQUIRED LATER |
| Teacher dashboard/race list | DONE | DONE | DONE |
| Create race/room code | DONE | DONE | DONE |
| Teacher waiting room | DONE | DONE | DONE |
| Start race command | DONE | DONE | DONE |
| RacePlayer join/session | DONE | DONE | DONE |
| Student waiting page | race-state exists | DONE incl. live waiting→race transition | DONE |
| Question template/generation | DONE | N/A | DONE |
| Question persistence/delivery | DONE (POST resolve, per-player lock, epoch timing) | question panel + timer integrated | DONE |
| Answer validation | DONE | submit + server-driven feedback wired (C1-03) | DONE |
| Race engine | DONE | answer snapshots drive the race screen (C1-03) | DONE |
| Student runtime snapshot | DONE | applied from race-state AND answers via one mapper | DONE |
| Heartbeat/leave/reconnect | DONE | heartbeat + reconnect lifecycle DONE (C1-05); leave deliberately unwired | DONE |
| Student Pixi race foundation | N/A | UI-10A–G DONE | PARTIAL feature |
| Student question panel/HUD | server data exists | panel + timer DONE (C1-02); HUD stats DONE (C1-04) | DONE |
| Opponent vehicles/nearby players | DONE snapshot contract + decision-instant standings (C2-01) | DONE pooled renderer, shared motion, 2/4/7 density, lane-fit, static colors (C2-03) | DONE (device acceptance open) |
| Student live stream + finish arbitration | DONE signal-only SSE, proof-gated arbitration | DONE SSE invalidation + polling fallback, proof-gated finish presentation (C2-02/C2-04) | DONE |
| Teacher live-state query | DONE incl. lifecycle epochs (C3-00) | DONE live route, initial/recovery integration (C3-01) | DONE |
| Teacher durable live-event model | DONE | N/A | SERVER FOUNDATION |
| Teacher SSE | DONE | DONE durable sync, authoritative recovery/fallback (C3-02) | DONE |
| Teacher live projector UI | N/A | DONE jungle-art projector with eight side-view vehicles, animated server-ordered leaderboard with the shared placement art, responsive workspace navigation (C3-03 … C3-08) | DONE |
| Results | DONE final read model (S3-01) | DONE teacher Result Screen + student progressive results (C4) | DONE |
| Junction/highway/dirt road | PLANNED | PLANNED | REQUIRED |
| Fair luck/power-ups | foundation ideas only | PLANNED | REQUIRED |
| Catch-up assistance | foundation ideas only | PLANNED | REQUIRED |
| Local MySQL + automatic Redis dev setup | DONE | N/A | DONE |
| Production migrations/deployment | PLANNED | build exists | PLANNED |

## Backend implemented

- Java 21 / Spring Boot application.
- Spring Security with JWT cookies and role/ownership checks.
- `User`, `Subject`, `Race`, `RacePlayer`, question and answer domains.
- Teacher dashboard, race creation, room data and start command. Dashboard race
  summaries retain their exact contract while `currentPlayers` now counts all durable
  RacePlayer rows through one grouped query for the complete ordered race list;
  races without players map to zero and an empty dashboard skips the count query.
  `waitingRaces` includes WAITING_FOR_PLAYERS and READY, while `activeRaces`
  remains IN_PROGRESS.
- Dashboard `raceId` plus `status` are the complete server-owned navigation truth:
  WAITING_FOR_PLAYERS/READY use room, IN_PROGRESS uses live, FINISHED uses S3-01
  results and CANCELLED has no primary target. The client owns route selection; no
  server URL/action fields or separate navigation endpoint exist.
- RacePlayer join with race-specific cookie/session.
- Idempotent question-template seeding and math generation patterns.
- Generated-question and choice persistence before delivery.
- Safe question DTOs without correct-answer leakage.
- Answer validation, expiry handling and duplicate-submit protection.
- Race engine for score, progress, speed, streak, difficulty and finish state.
- Shared runtime snapshot and race-state endpoint, including server-owned competition
  rank, joined-player count and the full safe `opponents` roster (server C2-01)
  shared with submit-answer and finish-arbitration responses.
- Redis-based presence, monotonic trusted gameplay activity, heartbeat, leave and
  reconnect grace; only heartbeat/reconnect renew the 45-second presence lease,
  active `RACING + IN_PROGRESS` gameplay queries/actions record activity, absent
  active requests require explicit reconnect without re-anchoring, terminal
  race-state remains readable without presence, and Redis failure is explicitly
  fail-open.
- Runtime repeat policy is verified across refresh, heartbeat, reconnect, leave,
  current-question and answer: only a real reconnect resume may re-anchor, duplicate
  leave has no repeated gameplay side effects, current-question preserves the ACTIVE
  identity/deadline, and duplicate or terminal answers cannot apply engine effects.
- Server focus-integrity foundation persists cumulative focus-loss state plus
  idempotent per-event, per-question audit rows. TAB_HIDDEN/TAB_VISIBLE classification
  is server-timed and session-scoped. Race creation selects OFF/WARN/STRICT with WARN
  default; STRICT forfeits the third same-question loss through the existing timeout
  owner without activity renewal, reconnect, catch-up movement, player removal or
  next-question creation. Focus and policy columns use DB defaults for safe existing-
  row DEV backfill; production migrations remain Phase 6 debt.
- Teacher-owned `GET /api/teacher/races/{raceId}/live-state` returns a read-only,
  projector-ready recovery snapshot with race details, focus policy, injected-clock
  server time, `baseMovementUnitsPerSecond` from `RaceProgressRules`, durable event
  version and all RacePlayers in shared authoritative competitive order. The query
  uses MySQL only, performs one owned Race lookup and one player-list read, and never
  settles movement or mutates gameplay. The baseline is rendering/reference data,
  unlike the student's effective per-player `movementUnitsPerSecond`; teacher
  snapshots do not promise a shared movement anchor at the server/event timestamp,
  so future rendering interpolates toward server positions without advancing truth.
- `Race.liveEventVersion` maps to non-null `live_event_version` with entity and DB
  default `0` for DEV schema backfill. S2-02 atomically increments it in the same
  business transaction that persists each durable `RaceLiveEvent`; committed live-
  state `eventVersion` equals the highest committed event version.
- The S2-02 durable vocabulary is exactly `PLAYER_JOINED`, `RACE_STARTED`,
  `QUESTION_ANSWERED`, `PLAYER_PROGRESS_UPDATED`, `PLAYER_FINISHED` and
  `RACE_FINISHED`. Progress and terminal payloads reuse the shared full-player
  authoritative rank snapshot. Active mutations are serialized by a per-Race
  pessimistic gate after the player lock, so higher event versions cannot regress a
  committed player state or rank from a lower version. WAITING lifecycle paths do not
  acquire that gate or emit progress events. Redis is not event truth.
- Teacher-owned `GET /api/teacher/races/{raceId}/events/stream` delivers committed
  durable envelopes after a required version cursor. Raw `Last-Event-ID` selection
  takes precedence before the fallback `afterVersion` query is parsed; malformed
  selected, negative, missing and future cursors return focused HTTP 400 error
  `RACE_LIVE_EVENT_CURSOR_INVALID`. Replay is MySQL-backed, Race-
  scoped, ascending and bounded to 100 events per read. Each connection has a server-
  generated identity and independent cursor, which advances only after a successful
  send. A one-second dispatcher runs on its own focused single-thread scheduler so
  transport DB/network work cannot occupy the gameplay maintenance scheduler.
  Fifteen-second comment-only heartbeats keep idle transports alive, and completion,
  timeout, error or send
  failure removes the connection idempotently. Live-state remains the complete
  initial/recovery snapshot. The legacy generic `/api/sse` implementation is
  unchanged and unused by S2; production cross-node fanout and schema migrations
  remain later production work.
- Teacher-owned `GET /api/teacher/races/{raceId}/results` exposes a FINISHED-only,
  read-only durable result model from the existing Race/RacePlayer truth. It includes
  the subject, lifecycle epoch timestamps, every participant in shared authoritative
  standing order, competition ranks, all rank-1 finishers, zero-safe summary totals,
  and factual positive-value score/correct-answer/streak awards with all ties. Missing
  and foreign Races remain hidden as `RACE_NOT_FOUND`; non-finished statuses return
  `RACE_RESULTS_NOT_AVAILABLE`. No RaceResult persistence, Redis state, result event,
  movement settlement or finish mutation is introduced.

## Client implemented

- React/Vite application with routing and role/guest guards.
- Mantine-first application UI foundation.
- Light/dark theme and shared design tokens.
- i18next Hebrew/English namespaces.
- Landing and teacher authentication screens.
- Teacher workspace, dashboard, race list, create-race flow and waiting room.
- Teacher Live route/page with initial snapshot, durable SSE updates, recovery and
  projector-oriented track, leaderboard and activity presentation.
- Teacher Result Screen (C4-A): winners, factual awards and final standings exactly as the
  S3-01 read model orders them, with explicit not-found, not-ready and retry states.
- Student results on the race route (C4-B1/C4-B2): WATCHING groups while the race runs,
  FINAL rank cohorts afterwards, finish proof before any place is shown.
- Shared results art (C4-C): front hero karts on a podium, medals, a neutral placement
  badge and award emblems; the rank and every name stay real DOM text.
- Student join and waiting flow.
- Student race UI-10A–G:
  - common runtime contract
  - central API wrappers
  - asset manifest
  - manual PixiJS renderer
  - local runtime
  - perspective world layers
  - continuous road model
  - layout contract and question-panel shell.
- Runtime-session visibility handling: hidden stops heartbeat and gameplay calls;
  visible return is reconnect-first and authoritatively resyncs before play resumes.
- Semantic `RACE_PLAYER_RECONNECT_REQUIRED` failures from race-state, question or
  answer hand recovery to the existing runtime-session reconnect owner; answer POSTs
  are never retried automatically.
- ACTIVE question identity and deadline survive hidden/reload/reconnect; timeout
  remains wall-clock and exactly once, preventing question fishing.

## Known stale code/document comments

These must be corrected during the next client integration work:

- Old Stage B issue tables mark completed backend work as TODO.

## Immediate next product outcome

```text
Server S4-01 defines the shared game effect/event contract
→ junction, highway/dirt-road, luck and assistance rules stay server-authoritative
→ C5 renders those server events on the student race and the projector
→ every effect survives refresh and is never recalculated on the client
```

C2, C3 Teacher Live and C4 Results are implemented on the client: C3-01/C3-02 merged in
PR #69, C3-03 … C3-08 are COMPLETE, and C4-A … C4-C (teacher Result Screen, student
progressive results, results art) are COMPLETE on `feature/C4-results`. The S4-01 server
contract (PR #74) and C5-A audio (PR #75, which also delivered the C2-A race sound) are
merged; C5-01 (PR #76), the S4-02/S4-03 Challenge contract (PR #77) and the C5 Track A
presentation (PR #78) are merged; C5-02 (Challenge choice) is committed locally and C5-03
(results, Safe progress, poses, painted Turbo exhaust and slowdown cues) is implemented and
tested on the same feature branch, not merged to `main`. The required physical-device/recovery QA remains visible pre-release polish.
