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
- choice buttons carry ids and the onChoiceSelect contract now used by the
  C1-03 answer flow.

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
- continuous authoritative movement (C1-03M): position itself advances on
  the server with time; the client silently polls race-state every 2s while
  PLAYING (shared `silentRefresh` — NOT the C1-05 heartbeat), orders
  snapshots by `snapshotAtEpochMs` (late responses never roll state back),
  and the renderer PREDICTS between snapshots with the server-owned
  `movementUnitsPerSecond` (drawing only; finish stays server truth);
  race start grants `MIN_RACING_SPEED` + the movement anchor server-side
- recovery: expiry = time-up + question resync (no snapshot); stale
  submitted-question conflicts (`isStaleQuestionSubmissionError`), lifecycle
  conflicts and ambiguous transient failures resync race+question with no
  automatic POST retry; session errors gate to `/join`.

### Student race HUD (C1-04 — done 2026-08-19)

- compact HUD in the existing safe area: score / existing question timer /
  streak on top, progress bar + speed below — all read-only from the same
  runtime state that race-state polling and answer snapshots already update
  (no new store, polling or API)
- progress is presentation-only (`getRaceProgressRatio`): clamped drawing of
  position/totalDistance; no bar when the server has not provided a valid
  distance; no rank (S1-02), no effect badge (no authoritative activeEffect
  field yet), no difficulty in the HUD
- client automated test foundation added (Vitest + jsdom + React Testing
  Library, `npm run test`) with focused HUD/progress tests; policy in
  TESTING_AND_DEFINITION_OF_DONE.

### Runtime session / presence (C1-05 — done 2026-08-19, live E2E verified)

- one shared lifecycle owner (`useRacePlayerRuntimeSession`) for BOTH the
  waiting and race pages: reconnect-first route entry (gameplay hooks mount
  only after the server resolves the lifecycle), 15s heartbeat while visible,
  CONNECTED and online (single-flight), immediate reconnect on browser online /
  hidden→visible / manual retry, ONE conservative 5s retry
  for transient failures
- degraded connection keeps the last-known screen: polling/questions pause,
  answers lock, shared `RacePlayerConnectionNotice` shows OFFLINE/
  RECONNECTING; every reconnect resolution triggers an authoritative
  race-state resync (`authoritativeResync` supersedes in-flight requests)
- semantic `RACE_PLAYER_RECONNECT_REQUIRED` from race-state, current-question or
  answer immediately closes gameplay readiness and calls the same runtime-session
  reconnect owner; success performs the existing authoritative resync, while the
  rejected answer POST is never replayed automatically
- hidden is temporary gameplay absence: heartbeat, polling and question requests
  stop, answers lock and gameplay-ready is false. The server question wall clock
  continues and movement freezes at the latest trusted activity. Returning visible
  stays closed until reconnect and authoritative resync complete
- the heartbeat callback also checks current document visibility directly, so an
  already-queued timer cannot send a hidden-document heartbeat
- the current ACTIVE question and original deadline survive hidden/reload/reconnect;
  the client never requests a replacement merely because visibility changed
- server truth boundaries: local offline never invents DISCONNECTED;
  terminal outcomes (finished/already-disconnected/window-expired) stop the
  heartbeat and let race-state decide the view; window expiry is lifecycle,
  not a session error (no `/join` redirect); the DISCONNECTED view no longer
  offers a useless retry
- leave stays deliberately unwired — refresh/unmount/pagehide never mutate
  the server session.

### Student vehicle art (C1-06A–C — done 2026-08-23)

- `race-state.player` identity (`vehicleAssetKey` etc.) mapped into
  `runtimeState.player`, preserved across snapshots
- `studentRaceVehicleManifest` maps the server key to client art; the loader
  loads only that vehicle's idle frames and never throws (explicit fallback)
- `PlayerKartLayer` shows the real `TOY_CAR_GREEN` static sprite; unknown
  key / malformed entry / load failure keep the Graphics placeholder
- other colors still render the placeholder until their art lands.

## Missing integration
- opponent vehicles
- teacher live page
- SSE
- results pages
- full auth server flows.

## Stale client state to clean

- live/results route constants exist without routes.

## Immediate client priority

```text
real assets/opponents (C1-06/C2)
→ teacher live/SSE (C3)
```
