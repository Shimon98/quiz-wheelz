# Project Current State

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the audited implementation status across the complete product

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Audit boundary

This state is based on GitHub `main` at the recorded baseline. A local branch named
`chore/redis-dev-autostart` appeared in the development environment but was not
available in the GitHub branch search. Treat its changes as `VERIFY LOCALLY` until
they are reviewed and merged.

## Executive summary

QuizWheelz is not an early prototype. Most backend gameplay foundations and the
teacher/student pre-race client flows exist. The main missing product slice is the
real playable student race connected to the server, followed by the teacher live
race/SSE screen and results.

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
| Student waiting page | race-state exists | DONE, needs live transition | PARTIAL |
| Question template/generation | DONE | N/A | DONE |
| Question persistence/delivery | DONE | wrapper exists | PARTIAL integration |
| Answer validation | DONE | wrapper exists | PARTIAL integration |
| Race engine | DONE | not wired to real race screen | PARTIAL integration |
| Student runtime snapshot | DONE | contract/mapper foundation exists | PARTIAL |
| Heartbeat/leave/reconnect | DONE | not integrated | PARTIAL |
| Student Pixi race foundation | N/A | UI-10A–G DONE | PARTIAL feature |
| Student question panel/HUD | server data exists | PLANNED | PLANNED |
| Opponent vehicles/nearby players | missing contract | planned renderer | PLANNED |
| Teacher live-state query | PLANNED | route constant only | PLANNED |
| Teacher SSE | PLANNED | PLANNED | PLANNED |
| Results | basic finish logic exists | route constant only | PLANNED |
| Junction/highway/dirt road | PLANNED | PLANNED | REQUIRED |
| Fair luck/power-ups | foundation ideas only | PLANNED | REQUIRED |
| Catch-up assistance | foundation ideas only | PLANNED | REQUIRED |
| Automatic MySQL + Redis dev setup | PARTIAL/VERIFY LOCALLY | N/A | PARTIAL |
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

- `apiEndpointConstants.js` still says race-state is not implemented.
- Heartbeat, leave and reconnect endpoints are not registered in the client constants.
- Teacher live and results routes are constants only; they are not routed.
- There is no real student race route.
- The nested studentRace README still describes race-state as blocked.
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
