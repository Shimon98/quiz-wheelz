# Project Current State

**Status:** Canonical  
**Audit date:** 2026-08-24
**Code baseline:** `main@3b095ac47c3d0b237ce50811e53d0a6720ad3847`
**This document owns:** the audited implementation status across the complete product

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Audit boundary

This state is based on GitHub `main` at the recorded baseline plus the completed
S0-01 development-infrastructure implementation verified on both development
machines.

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
players do not keep the class race open. The main missing product slices are
opponents, real assets, and the
teacher live race/SSE screen and results.

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
| Opponent vehicles/nearby players | DONE authoritative snapshot contract | planned renderer | PARTIAL |
| Teacher live-state query | DONE | route constant only | PARTIAL feature |
| Teacher SSE | PLANNED | PLANNED | PLANNED |
| Results | basic finish logic exists | route constant only | PLANNED |
| Junction/highway/dirt road | PLANNED | PLANNED | REQUIRED |
| Fair luck/power-ups | foundation ideas only | PLANNED | REQUIRED |
| Catch-up assistance | foundation ideas only | PLANNED | REQUIRED |
| Local MySQL + automatic Redis dev setup | DONE | N/A | DONE |
| Production migrations/deployment | PLANNED | build exists | PLANNED |

## Backend implemented

- Java 21 / Spring Boot application.
- Spring Security with JWT cookies and role/ownership checks.
- `User`, `Subject`, `Race`, `RacePlayer`, question and answer domains.
- Teacher dashboard, race creation, room data and start command.
- RacePlayer join with race-specific cookie/session.
- Idempotent question-template seeding and math generation patterns.
- Generated-question and choice persistence before delivery.
- Safe question DTOs without correct-answer leakage.
- Answer validation, expiry handling and duplicate-submit protection.
- Race engine for score, progress, speed, streak, difficulty and finish state.
- Shared runtime snapshot and race-state endpoint, including server-owned competition
  rank, joined-player count and a safe deterministic max-4 nearby-player window shared
  with submit-answer responses.
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
  server time, durable event version and all RacePlayers in shared authoritative
  competitive order. The query uses MySQL only, performs one owned Race lookup and
  one player-list read, and never settles movement or mutates gameplay.
- `Race.liveEventVersion` maps to non-null `live_event_version` with entity and DB
  default `0` for DEV schema backfill. S2-01 only reads it; S2-02 owns future event
  vocabulary and increments, while S2-03 owns the SSE stream. Production migration
  remains Phase 6 debt.

## Client implemented

- React/Vite application with routing and role/guest guards.
- Mantine-first application UI foundation.
- Light/dark theme and shared design tokens.
- i18next Hebrew/English namespaces.
- Landing and teacher authentication screens.
- Teacher workspace, dashboard, race list, create-race flow and waiting room.
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

- Teacher live and results client routes are constants only; they are not routed.
- Old Stage B issue tables mark completed backend work as TODO.

## Immediate next product outcome

```text
Teacher creates and starts a race
→ RacePlayer joins
→ student race route loads real race-state
→ real question appears
→ answer is submitted
→ server snapshot moves the hover kart
→ HUD updates
→ refresh/reconnect recovers the same player
```

No teacher SSE, luck event, junction or 2FA work should interrupt this slice unless it
is required to make the slice run safely.
