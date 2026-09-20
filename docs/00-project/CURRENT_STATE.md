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
Live are merged. The server final-results read model is implemented by S3-01; the C4
Result Screen remains future client work.

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
| Teacher live-state query | DONE | DONE initial/recovery integration | DONE |
| Teacher durable live-event model | DONE | N/A | SERVER FOUNDATION |
| Teacher SSE | DONE | DONE recovery/fallback integration | DONE |
| Results | DONE final read model (S3-01) | C4 PLANNED | PARTIAL feature |
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

- The results route constant exists without the C4 Result Screen route/page.
- Old Stage B issue tables mark completed backend work as TODO.

## Immediate next product outcome

```text
Teacher completes a multi-player race
→ server exposes durable final ranking, winners, summary and factual awards
→ C4 loads the final result read model
→ teacher sees the complete Result Screen
→ navigation returns to race history/dashboard
```

C2 and the C3 Teacher Live foundation are merged. S3-01 provides the server
final-results read model; C4 is the next client results stage. C2-A race sound and
required physical-device/recovery QA remain visible pre-release polish.
