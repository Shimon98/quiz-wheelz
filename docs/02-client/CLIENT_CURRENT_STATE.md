# Client Current State

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the implemented React/UI/game-rendering capabilities and remaining integration work

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Stack

- React 19
- Vite 8
- React Router
- Mantine
- Tailwind 4 for custom composition
- i18next/react-i18next
- Axios
- Zustand
- PixiJS
- Framer Motion for React UI animation
- Lucide React
- react-qr-code.

## Implemented product areas

### Foundation

- app/router/providers
- auth/language/theme global stores
- HTTP client with credentials
- role and guest guards
- API and route constant files
- shared notification/error handling
- light/dark design tokens.

### Public and teacher UI

- product landing shell
- teacher login
- client registration/forgot-password screens
- teacher workspace shell
- dashboard and race list
- create-race form
- teacher waiting room
- start-race action
- Hebrew/English namespaces.

### Student pre-race

- join by code/name
- code-from-route support
- waiting screen with authoritative race-state polling (~2s while WAITING)
- automatic waiting → race transition when the teacher starts
- mobile-first shell.

### Student race bootstrap (C1-01 — done, E2E verified 2026-08-17)

- production `/student/race` route, lazy, standalone from the entry shell
- `getRaceState` wrapper + shared `useRacePlayerState` request lifecycle
- normalized semantic API errors; RacePlayer session distinct from teacher auth
- race-state → `StudentRaceRuntimeState` mapping (`applyRaceSnapshot` is the
  one snapshot mapper, ready for the C1-03 `raceImpact.snapshot` reuse)
- `getRaceView` view resolution (WAITING/PLAYING/FINISHED/CANCELLED/
  DISCONNECTED/UNKNOWN)
- `StudentRacePage` + status presentations, incl. basic FINISHED state
- shared `RacePlayerSessionGate`: invalid RacePlayer session → `/join`
- refresh/direct entry rebuild everything from the HttpOnly cookie via
  race-state; `sessionStorage` joinData is display cache only.

### Student race UI-10 foundation

Implemented A–G:

- runtime contract
- API wrappers for current question/answer
- shared status constants
- asset keys/manifest/config
- manual Pixi renderer
- local snapshot runtime
- perspective road/jungle/kart/effects layers
- unified projection
- near/mid/far depth zones
- full-screen world + React overlay layout
- persistent question-panel shell
- dev-only preview.

### Student race question panel (C1-02 — done, E2E verified 2026-08-18)

- real current question + choices from the server, rendered in the panel
  that replaced the UI-10G shell (same geometry contract)
- question lifecycle hook separate from the race runtime; requests only
  while authoritatively PLAYING
- deadline timer chip in its final HUD position; question timing uses the
  server-provided absolute epoch deadline plus a server clock reference
  (offset calibration), so refresh, background tabs, device timezone and
  clock skew cannot drift it — the client only presents the countdown and
  the server remains the expiry authority; current-question is a POST
  resolve; expiry locks and resyncs once (single-flight with one pending
  trailing refresh)
- choice buttons carry ids and an onChoiceSelect contract, disabled until
  C1-03 wires submission.

### Student answer loop (C1-03 — done 2026-08-19)

- real submit on choice tap: immediate lock (single-flight), neutral
  selected state, then server-driven ✓/✕ feedback with i18n text — never
  color-only, never client-computed correctness
- `mapSubmitAnswerToModel` boundary (identity echo + correct-answer
  membership checks); `raceImpact.snapshot` applied through the one
  `applyRaceSnapshot`, latest answer snapshot overrides the race-state
  baseline until a fresh race-state supersedes it
- feedback stays on the answered question model instance for the whole
  `feedbackDelayMs` window, then the next question resolves; the finishing
  answer keeps the race visible for that window before the finished view
- continuous Person-First road/jungle flow driven by authoritative server
  speed (renderer-internal offset; position/finish stay server-owned);
  race start grants `MIN_RACING_SPEED` server-side
- recovery: expiry = time-up + question resync (no snapshot); lifecycle
  conflicts and ambiguous transient failures resync race+question with no
  automatic POST retry; session errors gate to `/join`.

## Missing integration

- HUD
- heartbeat/leave/reconnect
- opponent vehicles
- teacher live page
- SSE
- results pages
- full auth server flows.

## Stale client state to clean

- live/results route constants exist without routes.

## Immediate client priority

```text
HUD + reconnect (C1-04/05)
→ real assets/opponents (C1-06/C2)
→ teacher live/SSE (C3)
```
