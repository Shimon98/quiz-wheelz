# Project Current State

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
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
snapshot → next question), with CONTINUOUS server-authoritative movement
(C1-03M): every racing student advances with time, correct answers boost
speed and add progress bonuses, timeouts slow more than wrong answers, and
every race is guaranteed to end — even for a student who never touches the
phone. The main missing product slices are student presence/reconnect polish,
opponents, and the teacher live race/SSE screen and results.

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
| Heartbeat/leave/reconnect | DONE | not integrated | PARTIAL |
| Student Pixi race foundation | N/A | UI-10A–G DONE | PARTIAL feature |
| Student question panel/HUD | server data exists | panel + timer DONE (C1-02); HUD stats DONE (C1-04) | DONE |
| Opponent vehicles/nearby players | missing contract | planned renderer | PLANNED |
| Teacher live-state query | PLANNED | route constant only | PLANNED |
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
- Shared runtime snapshot and race-state endpoint.
- Redis-based presence, heartbeat, leave and reconnect grace.

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

## Known stale code/document comments

These must be corrected during the next client integration work:

- Teacher live and results routes are constants only; they are not routed.
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
