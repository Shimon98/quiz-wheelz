# studentRace — Student Race Screen (UI-10)

The student's in-game screen: the kart sits fixed at the bottom, the world
(road, jungle layers, effects) moves toward it; React renders the HUD and the
question panel, PixiJS renders the world. Master plan (goals, stages, open
decisions): `docs/vision/ui10BigPlan_UPDATED.md`.

## Hard rules

- **The server is the source of truth.** The client never computes
  correctness, score, progress, speed, difficulty, finish, or winner — it
  sends actions and renders the state the server returns. Visual-only
  animation/interpolation is allowed; official values are not.
- **React owns UI state; Pixi owns rendering only.** Frame-by-frame values
  (visualPosition, camera, world offset) live inside the Pixi renderer —
  never in React state. The contract carries targets only
  (`visual.targetPosition` / `targetSpeed` / `activeEffect`).
- **React → Pixi bridge is imperative.** The renderer is created once and
  held in a ref; the controller pushes updates into it
  (`renderer.updateRuntimeState(state)`). Runtime state is never passed as
  props that re-render a Pixi tree, and React never renders because of an
  animation frame.
- **One state contract.** Every data source — REST responses, submit-answer
  `raceImpact`, the temporary local runtime, future SSE snapshots — is mapped
  in `runtime/` into the same `StudentRaceRuntimeState`
  (`createInitialRaceRuntimeState.js`). The screen never knows the source.
- **No duplicated server enums.** Race/player status names are the shared
  constants (today in `features/teacherWorkspace/config/raceStatusConfig.js`;
  hoisted to `src/constants/` when this feature first consumes them, UI-10B).
  This folder only defines client-new vocabulary
  (`studentRaceRuntimeConstants.js`: feedback phases, effect ids).
- **No invented endpoints.** Only endpoints that exist on the server get
  wired. Missing contracts (below) get a clean stub + TODO, never a made-up
  URL.
- **Texts via i18n.** A `studentRace` namespace under
  `client/src/i18n/locales/{he,en}` — added in the first stage that renders
  text. No hardcoded user-facing strings, no `content/` folder.

## Pending server decisions (Diana)

Initial race-state endpoint, student SSE snapshots, refresh/reconnect
semantics, pre-start current-question behavior, timer-expiry behavior,
nearbyPlayers. The single source of status is the open-decisions table in
`docs/vision/ui10BigPlan_UPDATED.md` (§25 + §28) — intentionally not
duplicated here.

## Stage status

- UI-10A (contract + skeleton): done — this folder.
- UI-10B (known parts): done — gameplay endpoint constants + wrappers live in
  `src/api/racePlayerApi.js` (project convention: central api folder, no
  per-feature api/), status enums hoisted to
  `src/constants/raceStatusConstants.js`. The route, the guard and the
  race-state integration wait for the server's race-state endpoint
  (approved by Diana, ships after 24C-0).
- UI-10C (assets + configs): done — asset keys + manifest under
  `pixi/assets/`, screen geometry in `config/raceVisualConfig.js`, unit
  conversions + motion tuning in `config/raceAnimationConfig.js` (the ONLY
  place that knows server-units → pixels), asset-folder rules in
  `src/assets/game/studentRace/README.md`. `studentRaceConfig.js` slimmed to
  flow timings only — every constant has exactly one owner.
- UI-10D (Pixi shell): done — manual pixi.js v8 (`pixi/`): async-safe app
  creation, `StudentRaceRenderer` (container skeleton, ticker, interpolation
  from `raceAnimationConfig`, renderer-internal visualPosition), ONE resize
  mechanism (ResizeObserver helper), safe teardown helper, thin React wrapper
  with the imperative `updateRuntimeState` bridge. Debug marker only — the
  world lands in UI-10F.
- UI-10E (local runtime): done — dev-only movement source
  (`runtime/localStudentRaceRuntime.js`, 500ms snapshots, wraps at track end,
  never fakes finish/score/questions) + `mapLocalRuntimeSnapshotToState.js`
  (same mapper shape the future SSE mapper will have).
- UI-10F (world layers): done — pseudo-perspective over-the-shoulder camera
  (the binding F decision: trapezoid road converging to the horizon, depth
  flow toward the player — NOT a flat scrolling texture). Five layers under
  `pixi/layers/` (jungle, road, finish line, player kart, effects/dust),
  each with the uniform interface `resize/update(frameState)/destroy`;
  perspective math lives ONCE in the renderer and reaches layers via
  `frameState.perspective`. Placeholder drawing is colocated inside each
  layer (dies with it when real art lands). Renderer gained a
  `playerContainer`, lost the D debug marker, and snap-guards the local
  runtime's wrap-around. Dev preview: `dev/StudentRaceVisualPreview.jsx`
  (unrouted — wire a temp route to eyeball, remove before commit).
- UI-10G…M: see the master plan §22.
