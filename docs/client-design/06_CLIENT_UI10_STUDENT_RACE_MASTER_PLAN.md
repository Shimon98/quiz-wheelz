# UI-10 — Student Race Screen: Master Plan & Status

> **This file is the single source of truth for UI-10 (student race screen)
> planning — shared with the whole team.** It exists to keep the client
> UI-10 work aligned with the server Stage B issues (20–24+): §6 lists what
> the client consumes vs. waits on from the backend, and §9 lists the open
> questions for it. Scratch planning stays in the local `docs/vision/`
> folder (gitignored); this doc carries only the agreed, current state.
>
> **Last updated: 2026-07-06, end of stage UI-10G.**
> Branch: `feature/ui-10-student-race-screen`.

---

## 1. Status Board

| Stage | Name | Status | Where it lives |
|---|---|---|---|
| UI-10A | Contract + folder skeleton | ✅ DONE (committed) | `features/studentRace/` README, `runtime/createInitialRaceRuntimeState.js`, `runtime/studentRaceRuntimeConstants.js`, `config/studentRaceConfig.js` |
| UI-10B (known parts) | Gameplay API wrappers + shared status constants | ✅ DONE (committed) | `api/racePlayerApi.js` (getCurrentQuestion/submitAnswer), `constants/apiEndpointConstants.js` (incl. RACE_STATE pending), `constants/raceStatusConstants.js` |
| UI-10C | Asset keys + manifest + visual/animation configs | ✅ DONE (committed) | `pixi/assets/`, `config/raceVisualConfig.js`, `config/raceAnimationConfig.js`, `src/assets/game/studentRace/README.md` |
| UI-10D | Manual Pixi shell | ✅ DONE (committed) | `pixi/` (canvas wrapper, app factory, renderer, resize/cleanup utils) |
| UI-10E | Local visual runtime adapter | ✅ DONE (committed) | `runtime/localStudentRaceRuntime.js`, `runtime/mapLocalRuntimeSnapshotToState.js` |
| UI-10F | Pseudo-perspective world layers | ✅ DONE (committed) | `pixi/layers/` (jungle, road, finish line, kart, effects), `dev/StudentRaceVisualPreview.jsx` |
| UI-10F-1 | Track model lock + unified projection + dev env hardening + this doc rewrite | ✅ DONE (this update) | `perspective.projectTrackObject` in the renderer, FinishLineLayer as first consumer, `roadBottomWidthRatio: 1.35`, DEV-guarded `/dev/race`, this file |
| UI-10F-2 | Road visual alignment + LIVE view zones + port hygiene | ✅ DONE | Lane-less muddy `RoadLayer` consuming `raceVisualConfig.viewDepthZones` (center markers removed, curbs fade in the near zone, scattered mud details), assets-README loop contradiction fixed, preview tooling forced to port 3000 (`.claude/launch.json`) |
| UI-10G | Layout Contract | ✅ DONE | `layout/StudentRaceScreen.jsx` + `StudentRaceOverlay.jsx`, `components/StudentRaceQuestionPanelShell.jsx` + `StudentRaceHudSafeArea.jsx`, `utils/resolveStudentRaceLayoutMetrics.js`, `raceVisualConfig.layout` block; perspective now composed against the VISIBLE world above the panel; kart+dust anchored via `frameState.layout`; gameFrame (520px) live on wide screens; dev preview renders the full screen |
| UI-10H | Race-state bootstrap + route + guard | ⬜ blocked on server endpoint (see §6) | |
| UI-10I | Question panel + timer (+ first i18n namespace) | ⬜ after G | |
| UI-10J | Submit answer + snapshot mapper | ⬜ after H | |
| UI-10K | Basic HUD | ⬜ after J | |
| Asset passes | Part-by-part real art | ⬜ any time after G | see §8 |
| Opponents | OpponentKartLayer + nearbyPlayers | ⬜ FUTURE — blocked on server (24E-era) | see §4, §7 |

**Working rhythm:** each stage starts as a written brief; Claude reviews the
brief against the ACTUAL code on the branch (the GPT briefs don't track what
earlier stages already created), fixes discrepancies, executes, verifies
(lint + build + live preview), and Shimon commits.

---

## 2. Vision

Reference art: over-the-shoulder jungle kart race (monkey driver, waterfall,
dirt road with red/white curbs), HUD chips on top (score / timer / combo),
persistent question card at the bottom with 4 answer buttons (Hebrew, RTL).

Supreme principle (Diana's, locked):

```text
The server is the source of truth.
The client renders and animates.
The client never computes game rules
(correctness, score, progress, speed, difficulty, finish, winner, rank).
```

---

## 3. Locked Architecture Decisions

1. **One state contract.** Every data source (REST, submit-answer impact,
   local dev runtime, future SSE/reconnect) is mapped in `runtime/map*.js`
   into the same `StudentRaceRuntimeState`. The screen never knows the source.
2. **Null until the server says.** `raceStatus` / `playerStatus` /
   `totalDistance` / `currentDifficulty` start null; no fake fallbacks
   (dev stand-ins live ONLY inside `localStudentRaceRuntime.js`).
3. **React owns UI, Pixi owns frames.** Frame-interpolated values
   (visualPosition/camera) live inside the renderer, never in React state.
   The contract carries targets only (`visual.targetPosition/targetSpeed/activeEffect`).
4. **Imperative React→Pixi bridge.** Renderer created once, held in a ref,
   fed via `renderer.updateRuntimeState(state)`. Never Pixi-as-JSX, never
   re-render per frame. Manual `pixi.js`; `@pixi/react` stays installed but unused.
5. **Camera: pseudo-perspective, over-the-shoulder.** Trapezoid road to a
   vanishing point; world flows along the DEPTH axis; the player kart is
   screen-fixed. Never a flat scrolling texture. Values in `raceVisualConfig.camera`.
6. **One perspective implementation** built in the renderer, handed to every
   layer via `frameState.perspective` (incl. `projectTrackObject`, see §4).
7. **Uniform layer interface:** `resize(w,h)` / `update(frameState)` /
   `destroy()`. Placeholder drawing is colocated inside each layer and dies
   with it when real art lands.
8. **`raceAnimationConfig` is the only owner of unit conversions** (server
   units → pixels, lerp factors, view distance, effect durations). Layers
   never invent numbers. One owner per constant, everywhere.
9. **No duplicated server enums.** `RACE_STATUSES` / `RACE_PLAYER_STATUSES`
   live in `src/constants/raceStatusConstants.js` (hoisted in B;
   teacherWorkspace re-exports).
10. **Central API folder.** Wrappers live in `src/api/racePlayerApi.js` —
    no per-feature api folder. Thin wrappers only.
11. **Texts via i18n.** A `studentRace` namespace under
    `client/src/i18n/locales/{he,en}` — created in the first stage that
    renders text (UI-10I). No `content/` folders (dead convention).
12. **Dev tools never reach production.** Dev routes are lazy-imported and
    mounted only under `import.meta.env.DEV`; exclusion is VERIFIED by
    grepping the production bundle. Current dev environment: `/dev/race`
    renders `dev/StudentRaceVisualPreview.jsx` (local runtime only, no API).
13. **Honest UI.** No fake success, no invented data; a UI element with no
    server data behind it (e.g. a rank box) is not shown.

---

## 4. The Track Model (LOCKED in F-1)

**Name:** Player-Centered Wide Mud Track + Server Lanes as Invisible Slots
+ Depth-Aware Visibility.

**Verified server facts (read from source, 2026-07-05):**
- `RacePlayer.laneNumber` — mandatory, with a DB **unique constraint per race**
  (`race_id + lane_number`), assigned at join (`resolveNextAvailableLane`).
- `RacePlayer.vehicleColorKey` — mandatory, derived from laneNumber at join.
- Consequence: two players can NEVER share a lane → visual slot conflicts
  are structurally impossible; no dodge/tie-break mechanism needed for x.

**The rules:**

1. Visually there is ONE wide muddy jungle track — no lane lines, no lane
   numbers, nothing technical shown to the kid.
2. Behind the scenes, the invisible slots ARE the server's `laneNumber`
   (up to 8). Never client-invented slot assignments.
3. **Player-centered normalization:** MY lane is visually normalized to the
   screen center on EVERY phone — my kart is fixed bottom-center and the
   road stays a wide, SYMMETRIC, centered track no matter what my real
   laneNumber is. The road never shifts to show a global edge-lane position,
   and an edge-lane player does NOT see extra jungle on one side (that was
   an earlier idea — explicitly dropped). laneNumber is used ONLY to place
   opponents relative to me: `laneDelta = opponent.laneNumber - myLaneNumber`
   → lateral offset inside the road at that depth. Lateral mapping details
   (lane spacing, clamping/compressing extreme deltas near the road edge)
   are presentation-only tuning decided at the opponents stage — allowed,
   because the Depth Lock (rule 4) binds the depth axis only, never the
   lateral axis.
4. **Depth Lock (the cardinal rule):** screen depth (y + scale + draw order)
   is a PURE function of server position. Visual de-cluttering may only hide
   or fade karts — NEVER move them forward or backward. (Backward-shift
   creates the "looks like he lost at the finish line" bug Shimon found;
   forward-shift creates the same bug mirrored.)
5. Every student screen is a personal relative projection of the same server
   truth (each player is their own center); ordering is preserved in every
   reference frame, so screens never contradict. The teacher screen is the
   future global view.
6. **Road buffer:** the near road is wider than the screen
   (`roadBottomWidthRatio: 1.35`) — edges bleed off-frame next to the player;
   road edges + jungle read from mid-depth to the horizon. This is a
   camera/perspective property of EVERY player's screen — completely
   unrelated to laneNumber.
7. **Depth- AND lateral-aware visibility (Shimon's rule):** the view window
   is limited both forward (`viewDistanceAhead`) and in WIDTH per depth —
   near: only small laneDeltas are inside the frame, 1-2 karts (they are
   large); mid: a wider lateral field, 3-4 karts; far: the full track width,
   up to everyone ahead of me (they are small). Road edges + jungle read
   mainly at mid/far for the same reason — perspective + the near-road
   width, never the player's lane. **The zone split itself is LIVE since
   F-2**: `raceVisualConfig.viewDepthZones` (near/mid/far depth ranges),
   consumed today by RoadLayer (curb/edge fade); the opponent caps below
   join the SAME zones when opponents land. Conceptual caps shape (tuning
   values, future `raceVisualConfig.opponents`):
   `near { maxLaneDeltaVisible: 1, maxOpponents: 2 }` ·
   `mid { maxLaneDeltaVisible: 3, maxOpponents: 4 }` ·
   `far { maxLaneDeltaVisible: 7, maxOpponents: 7 }`.
8. **Stability is mandatory:** every opponent has a visual state machine
   (hidden → entering → visible → exiting → hidden) with hysteresis
   (different enter/exit thresholds) and soft fades. No popping, no
   flickering at zone borders.
9. A far kart smaller than a recognition threshold is drawn as a silhouette
   or not at all. No text inside the Pixi world, ever.
10. An opponent behind me is not drawn ahead; passing me = soft enter/exit at
    the bottom sides of the frame.
11. Every on-track object (finish line — live today; opponents, props,
    pickups — future) goes through ONE projection:
    `perspective.projectTrackObject(relativeDistance)` →
    `{ visible, depth, y, roadHalfWidth }`. Future extension: `laneDelta`
    argument for lateral offset. The finish line is the first live consumer.
12. `viewDistanceAhead` (in `raceAnimationConfig.projection`, 150 server
    units) is the visible track window AND therefore the finish-line reveal
    distance — one value, one owner.
13. Announcements (finish, rank, score) come from server fields ONLY, never
    inferred from pixels. `laneNumber ≠ rank`: lane is a fixed visual slot;
    rank is real standing by position and must come from the server. Without
    server rank there is NO "place 2/4" UI.
14. Future-only ideas (documented, not planned): focus-opponent priority,
    pack/cluster rendering, adjacent-lane presentation mode.

---

## 5. Layout Contract — IMPLEMENTED in UI-10G

1. The Pixi canvas is FULL-SCREEN; the React question panel overlays its
   bottom. The world continues behind the panel (the road surface extends
   behind it so rounded corners never reveal a seam).
2. **The whole perspective is composed against the VISIBLE world area above
   the panel** (`layout.world.bottomY` = panel top + `topOverlap`): horizon,
   depth zones, curb fade, finish line and kart all live in the visible
   strip. Without this, the near zone would hide behind the panel and the
   kart would float at mid-depth — this was the critical addition over the
   original G brief. Verified live: kart sits at depth t≈0.85 (near zone).
3. `utils/resolveStudentRaceLayoutMetrics.js` is the ONE numeric
   implementation (panel rect, visible world, kart/dust anchors, HUD strip);
   the renderer consumes it on resize via `frameState.layout`; the DOM panel
   mirrors the same clamp in CSS from the same config — verified equal live.
4. The question panel is **React/Mantine, never an image**; in G it is a
   skeleton shell only (no text — honest-UI; real content + the studentRace
   i18n namespace land in UI-10I). HUD top strip is a reserved spacer only.
5. `gameFrame.maxWidth` (520) is now LIVE: phones are edge-to-edge, wide
   screens get a centered game frame. (Known cosmetic nit: the app-global
   scrollbar-gutter shifts desktop centering by ~7px — imperceptible,
   accepted.)
6. Composition: `layout/StudentRaceScreen.jsx` (frame + canvas + overlay) →
   `layout/StudentRaceOverlay.jsx` (pointer-events-none wrapper; panel opts
   back in) → panel/HUD shells in `components/`.

---

## 6. Server Contract — verified vs upcoming

**Live on `main` today (verified from server source):**

```text
POST /api/race-players/join                      (client: joinRace)
GET  /api/race-players/me/question/current       (client: getCurrentQuestion)
POST /api/race-players/me/answers                (client: submitAnswer)
```

- Submit-answer currently returns the OLD flat raceImpact
  (`newScore/newPosition/newSpeed/...`). **Do not build against it** — it is
  being replaced (below). Nothing in the client consumes it yet.

**Upcoming from Diana (Issue 24C-1 — NOT yet on main, re-verify before H/J):**

- `GET /api/race-players/me/race-state` — envelope
  `{ raceId, raceTitle, roomCode, startedAt, finishedAt, snapshot }`.
- `snapshot` = the common runtime shape for race-state, raceImpact, future
  SSE and reconnect:
  `{ totalDistance, score, position, speed, streak, highestStreak,
     currentDifficulty, playerStatus, raceStatus, playerFinished, raceFinished }`.
- Submit answer becomes
  `raceImpact: { scoreDelta, progressDelta, difficultyChanged, snapshot }`.
- Load flow: race-state FIRST → route by `snapshot.raceStatus/playerStatus`
  (waiting → waiting screen; IN_PROGRESS+RACING → init world, then current
  question; finished → finish state). Current-question is NEVER the route guard.
- Timer is visual-only: at 0 → lock buttons → "time is up" → refetch current
  question; server decides expiration (verified: delivery service marks
  EXPIRED + regenerates; late submit throws QUESTION_EXPIRED).
- Refresh v1 = cookie + race-state + current question. No temporary reconnect
  (real reconnect/heartbeat/leave = future 24C).
- No student SSE in v1 (teacher SSE first). No timeout endpoint.
- **Bonus:** race-state also unblocks the student WAITING page — live status
  + auto-jump to the race screen when the teacher starts (old known gap).

**Local runtime note:** our local snapshot shape is a strict subset of
Diana's snapshot — the future server mapper is a sibling of
`mapLocalRuntimeSnapshotToState.js` with more fields.

---

## 7. Remaining Stages

### UI-10G — Layout Contract — ✅ DONE (see §5)

### UI-10H — Race-State Bootstrap + Route + Guard
**Entry condition: the race-state endpoint is merged on `main` (verify from
server source, not from docs).**
- `getStudentRaceState()` wrapper (constant already registered).
- `/student/race` route + `StudentRacePage` + bootstrap hook:
  race-state → route by status → current question only when active.
- `mapServerSnapshotToState.js` (sibling of the local mapper).
- Waiting-page upgrade (live status + auto-jump) can ride on this endpoint —
  its own small stage or part of H.

### UI-10I — Question Panel + Timer
- The persistent bottom panel: question text, 4 answers, visual timer,
  loading/error/disabled/time-up states.
- Creates the first i18n namespace `studentRace` (he + en + resources.js).
- Timer expiry flow per §6.

### UI-10J — Submit Answer + Snapshot Mapping
- Submit → disable → feedback (correct/wrong + correctAnswerChoiceId) →
  update runtime state from `raceImpact.snapshot` (re-verify exact shape
  from source first) → Pixi targets update → next question after delay.
- Delays from `studentRaceConfig` (feedbackDelayMs, nextQuestionDelayMs).

### UI-10K — Basic HUD
- Score, streak/combo, timer chips (React, top safe area).
- NO position/rank box until the server provides rank.

### Asset passes (independent, any time after G)
See §8. Each pass = one asset, one layer, zero architecture changes.

### FUTURE — Opponents (when the server ships nearbyPlayers)
Implementation checklist, in order:
1. Ask Diana the saved questions (§9).
2. Extend `projectTrackObject` with `laneDelta`.
3. `raceVisualConfig.opponents` block (view zones with per-zone opponent
   caps AND per-zone `maxLaneDeltaVisible`, lane width ratio + edge
   clamping/compression, hysteresis thresholds, recognition threshold).
4. `OpponentKartLayer` (worldContainer, between road and player): per-opponent
   interpolation keyed by playerId, visual state machine + fades, depth-aware
   caps, draw order by depth (tie-break by playerId for stability only).
5. Kart color variants keyed by server `vehicleColorKey`.
6. Only then: rank/position HUD if the server provides rank.

### FUTURE — other
24C reconnect/heartbeat/leave · student SSE (same snapshot shape) · finish
screen/celebration · full effects (correct/wrong/boost via
`EffectsLayer.playEffect`, durations already in config) · reduced-motion
policy for the game screen · focus/cluster polish · adjacent-lane
presentation mode (documented option only).

---

## 8. Asset Pipeline

**Process per part (always):** exact spec → Shimon generates art → drop the
file at the manifest's expectedPath (same name = zero code changes) → update
ONLY that layer to load it → verify. One part per pass.

**Categories (every asset declares one):**

| Category | Behavior | Examples |
|---|---|---|
| static background | almost no movement, painted backdrop | sky + waterfall + far jungle |
| screen-fixed | pinned to screen coordinates | player kart, dust origin |
| depth-projected | flows along the depth axis, scales with depth | side trees/bushes/signs, road markers |
| track-projected | positioned by server distance via projectTrackObject | finish line, future opponents/props |
| React overlay decoration | DOM/CSS above the canvas | question-panel leaves/frame decorations |

**Road spec (locked):** ONE wide muddy jungle track, no lane lines/numbers,
wider than the frame at the bottom (edges off-screen near the player), tire
marks/puddles/stones for texture, red-white curbs reading from mid-depth to
the horizon. Perspective art (trapezoid), never a flat vertical loop.

**Recommended order:** question-panel decorations (after G) → player kart →
far background → side vegetation sprites → road surface → effects → opponent
kart color variants (only with opponents).

Rules (in `src/assets/game/studentRace/README.md`): WebP by default, no text
inside images, no baked transparent margins, never rename a key.

---

## 9. Open Questions for Diana (future, none blocking now)

For the future nearbyPlayers/opponents contract:
1. Does each nearby player include `laneNumber` + `vehicleColorKey`
   (both already exist on the entity) + `displayName, position, speed, status`?
2. Range-limited (only within some distance window)? Pre-sorted by position?
3. Will the server provide `rank` + `totalPlayers`? (Without it — no rank UI.)
4. Snapshot cadence for students once SSE lands.

---

## 10. Working Rules (standing)

- **Git:** never on `main`; branch per task; Shimon commits (Claude commits
  only when explicitly asked). Lint + build before "done".
- **Docs hygiene:** scratch/Hebrew planning and conversations ONLY in
  `docs/vision/` (gitignored). This master plan and all repo files: English,
  factual, current-state only.
- **Dev environment:** dev-only routes/tools behind `import.meta.env.DEV` +
  lazy import; verify absence from the production bundle after changes.
- **Ports (learned the hard way, 2026-07-06):** the app's own dev server
  owns 5173. The server's CORS allowlist is `localhost:5173` +
  `localhost:3000` ONLY — a client served from any other port gets 403 on
  every API call, which masquerades as a login bug. Claude's preview
  tooling therefore runs on port 3000, forced via `.claude/launch.json`
  runtimeArgs `--port 3000` (the `port` field alone does NOT change Vite).
  launch.json is git-tracked, so this protects Diana's machine too.
- **Server truth:** before wiring any client behavior, verify the server
  shape from `server/src/main/java/...` source — docs and briefs drift.
  Server code is read-only; gaps are reported to Diana.
- **Verification:** hidden preview tab pauses rAF (Pixi frozen) — since G,
  `window.__studentRaceRenderer` (DEV-only handle set by
  PixiStudentRaceCanvas) allows manual `renderer.tick(...)` +
  `renderer.app.render()` + internal inspection on `/dev/race` directly, no
  temp harness needed. Mobile-emulated tabs have devicePixelRatio 2 — scale
  pixel-sampling coords by `canvas.width / renderer.width`. Screenshots of
  this app time out — measure, don't screenshot.
- **Stage briefs** from GPT must be diffed against the branch before
  executing — they routinely miss what earlier stages already built.
