# Client Current State

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the implemented React/UI/game-rendering capabilities and remaining integration work

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
Local checkpoint, 2026-09-08: **C1 development milestone closed and accepted
for C2** on `feature/C1-Student-playable-loop`, following Shimon's request.
This is a local implementation checkpoint, not a claim of merge or release.
The current 402 tests/49 files, lint and build pass; real API/browser flow
evidence remains dated 2026-09-07. Physical-phone and remaining browser
recovery/accessibility checks stay explicitly open in the pre-release
checklist in `CLIENT_IMPLEMENTATION_PLAN.md`.

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
- `assertValidRaceSnapshot` is shared by snapshot application and answer mapping;
  malformed snapshots cannot expose reward feedback first. The submitted question
  remains the feedback model during the dwell even if a background fetch supplies
  the next question.
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

### Student race HUD (C1-04 — done 2026-08-19; visual revision 2026-09-07)

- compact HUD in the existing safe area: server rank/player count, score,
  existing question timer, streak, progress and speed — all read-only from the same
  runtime state that race-state polling and answer snapshots already update
  (no new store, polling or API)
- progress is presentation-only (`getRaceProgressRatio`): clamped drawing of
  position/totalDistance; no bar when the server has not provided a valid
  distance. Rank and player count now pass through the shared snapshot mapper;
  no standing is shown when those server fields are missing or invalid.
  The stopwatch presentation formats the existing question countdown as
  minutes:seconds; it is not a new race clock. `getStudentRaceHudModel`,
  `getStudentRaceTimerModel` and `useStudentRaceQuestionTimer` own formatting
  and timer updates outside JSX. No persistent game-effect badge (no authoritative
  activeEffect field yet) or difficulty is shown in the HUD
- `StudentRaceSpeedometer` now renders the supplied server speed as a compact
  semicircular instrument and an explicit multiplier, such as ×0.7.
  `getStudentRaceSpeedometerModel` owns formatting and dial geometry;
  `speed / (speed + 1)` is only a visual scale, with no copied speed cap or
  invented km/h. Missing, negative or non-finite speed hides the instrument;
  zero remains valid. CSS transitions respect reduced motion and existing
  light/dark/system tokens.
- `StudentRaceReward` and the combo chip present accepted answer feedback.
  `getStudentRaceHudModel` formats the server score delta and streak; it never
  awards points or advances the combo. `useStudentRaceAnswer` owns the existing
  feedback dwell and question identity, so the reward expires while the next
  question loads and cannot carry into another question. This revision is
  implemented; its C1-06G verification remains separate from the earlier C1-04 gate.
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
- `PlayerKartLayer` shows the real `TOY_CAR_GREEN` static sprite; the kart
  area stays empty while art loads and the Graphics placeholder appears only
  after a definitive fallback (unknown key / malformed entry / load failure)
- every server color key renders the GREEN master until per-color art
  lands (interim manifest decision 2026-09-05).

### Student race visual feedback (C1-06E — done 2026-08-23; local revision accepted 2026-09-08)

- `EffectsLayer` plays procedural one-shots on the Pixi ticker: CORRECT /
  WRONG from the accepted answer feedback only, BOOST from an authoritative
  `targetSpeed` increase only, FINISH from `playerFinished` false→true only
- `StudentRaceScreen` hands the canvas a memoized presentation runtime
  (`visual.activeEffect`); HUD/overlay keep the authoritative runtime
- no effect from clicks, errors, reconnect-required or expiry; durations
  come from `raceAnimationConfig.effects`; ambient dust unchanged
- `StudentRaceContent` keeps the race canvas mounted through PLAYING→FINISHED
  for the finish effect duration (poll- or answer-driven) before the final
  status view.
- The current correct/combo revision uses the accepted question ID to deduplicate
  answer one-shots. `resolveStudentRaceFeedbackEffect` carries presentation-only
  event identity, server streak and reduced-motion preference; `EffectsLayer`
  and `drawFeedbackEffect` keep frame timing and geometry in Pixi. Focused
  visual tuning belongs to `raceFeedbackVisualConfig`. Reward text remains
  in React/i18n, and combo intensity does not alter speed, scoring or finish.

### Student race world art (C1-06F-0/1/2 — done 2026-08-24)

- deterministic art processing feeds `assets/game/studentRace/` (FAR horizon,
  seam-healed road loop); `worldArtConfig` owns placement/cadence values
- `JungleLayer` shows the static FAR horizon sprite (valley aligned to the
  vanishing point) over a static sky gradient, with a receding ground
  gradient beneath (F-1 backdrop, 2026-09-05); `RoadLayer` renders the flat
  road+shoulders texture through a projection-built 48×8 grid mesh scrolled
  by `worldOffset` with repeat wrap, mipmaps and anisotropic filtering, the
  road and kart widths derived from a width unit capped by the visible world
  height (wide frames keep phone proportions), and a localized mist ellipse
  at the vanishing point
- Graphics world remains the load fallback; V2 FAR panorama + ROAD loop
  were integrated on 2026-09-05; projected side
  ground + looping scenery props were integrated on 2026-09-07, then
  revised into six composition bands in the same `SceneryLayer`: rear
  thicket, canopy, trees, undergrowth, rocks and low roadside foliage.
  Eight assets, including transparent rear thicket and flowering verge, form
  588 deterministic staggered placements with varied size and lateral
  distance. The thicket fills gaps behind individual trees and connects
  the foreground foliage to the existing FAR through gradual entry opacity;
  128 low verge plants per side mix shrubs and flowers, with flowers also
  used in the undergrowth band. Tree bounds stay outside the road; low verge
  bounds overlap at most 26% of a road half-width to conceal
  the shoulder join. Road width, camera and logical depth zones are unchanged.
  Shimon accepted the current world design; this composition is the baseline
  for feedback polish and C2 rather than an open art trial.
- The thicket and new `jungle-verge-flowers-01.webp` are packaged as lossless
  WebP with every decoded RGBA byte verified against their private generated
  PNGs; artwork, dimensions and colors are unchanged. The flowers are
  1774×887 pixels / 1,344,364 bytes;
  metadata `anchorY` 0.94 places their dense base at the road edge without
  cropping the image. Side-ground texture density and a 48-row ground
  mesh reduce near-ground stretching and projection coarseness. Road sampling
  uses horizontal U coordinates 0.12–0.88 to omit the source's baked green
  strips and expose a wider muddy surface. Road vertices, longitudinal
  texture phase and shared world movement remain aligned. With reciprocal
  projection, road/ground repeats are calibrated to 960/710 world pixels.
  An optional edge feather in the existing `ProjectedTextureStrip` softens
  the outer 4% of each road half-width, independently of texture sampling
  and scrolling. Ground and MID retain the default unfeathered strip.
- `createRacePerspective` owns reciprocal distance projection and its inverse.
  Near objects now enlarge and pass faster than mid/far objects while road
  geometry and logical-zone thresholds remain unchanged. Road, ground,
  optional MID and Graphics fallbacks all use this mapping. Scenery alone opts
  into a signed exit tail beyond depth 1, so a partly visible crown keeps
  moving behind the question panel until its full bounds leave the viewport.
  There is no near-boundary fade or separate near-tree renderer. The fixed
  sprite population is reused across per-band loops (2400–4800 world pixels),
  keeping near foliage dense without adding sprites. Far entry fades adapt
  to the signed repeat window; the old MID strip remains off.
- Scenery sprites and the upright finish gate share the sortable world
  container and projected ground depth: distant foliage draws behind the
  gate and nearer foliage in front. `SceneryLayer` destroys only its own
  sprites. The gate uses poles and a checkered banner drawn once with Pixi
  Graphics, without baked text or a client finish decision. The screen-fixed
  kart is more prominent (`playerKart.maxWidthRatio` 0.34, previously 0.28),
  with the same center, anchor and track geometry.
- `studentRaceMotion` owns drawing prediction and correction in JavaScript,
  fed by the server movement rate. Base velocity responds over 400 ms;
  bounded position correction uses a 2800 ms horizon and 700 ms response.
  Both velocities advance the same visual position;
  authoritative position and finish truth stay in the existing runtime.
  Visual finish settling shares the existing 1200 ms finish-effect duration.
  The first EASY-sized sample (2→2.8 units/s, +10 position) peaks around
  5.48 units/s versus 7.41 before this refinement, then settles to 2.8.
  Sustained server movement is preserved; server code
  and its initial 2 / maximum 8 units/s rates are unchanged.
- Startup reveals the world after layer readiness settles, avoiding partial
  scenery appearing over an already visible road. Rejected asset loads use
  the existing fallback. Pending loads also fall back at the 10-second
  deadline in `worldArtConfig.loading.timeoutMs`; late results cannot mutate textures.
  Destruction before readiness cannot reveal the scene.
  DEV includes an explicitly labeled, clickable four-fixture question panel:
  correct, streak 3, streak 5 and wrong. Each fixture uses a unique question ID,
  the production answer mapper and the existing 900 ms feedback dwell.
  Sample score/streak belong only to this DEV harness; rank/count are not invented.
  The separate motion fixture supplies one boost at five seconds
  (0.5→0.7 speed, +10 position), sustained 2.8 units/s thereafter, and a
  finish approach beginning at position 900. Production already displays
  supplied server rank/count; missing standing stays hidden.
- HUD colors now follow existing light/dark/system theme tokens, including
  timer urgency. The existing theme providers and stored choice are reused.
- Validation rerun on 2026-09-08: all 402 client tests across 49 files,
  ESLint and the production build pass. The known main-chunk
  warning remains (899.70 kB; race chunk 271.17 kB). Built JavaScript contains
  no local-runtime, preview, motion-scenario or DEV-race identifiers. DEV browser checks at
  widths 320, 375, 412, 768, 1024 (short frame) and 1280 found no horizontal
  overflow and all four answers fit. Actual preview controls exercised the
  combo reward and Pixi burst; absent rank stayed hidden. Light English/LTR
  and system-dark Hebrew/RTL were inspected. Reduced motion has unit/CSS
  coverage; browser verification remains open. Earlier world QA covered
  finish-gate depth and theme switching; automated coverage also protects
  reciprocal projection, texture/prop agreement, repeat wrapping and sustained
  movement. World/motion presentation is accepted.
- Live API QA on 2026-09-07 covered an isolated two-player create/join/start flow,
  six correct/wrong submissions including streak 3, reconnect with speed 0.9
  retained, and normal finishes with ranks 1/2 and zero final movement rate.
  Real browser QA covered join/wait/start, correct feedback and speed 0.7,
  actual expiry and question reset, then consecutive correct answers with
  score 50, streak 2, COMBO +10, speed 0.9 and rank 1/2. Reload near 94%
  returned the authoritative FINISHED view. This verifies the answer/expiry
  and finish-return paths; current browser offline recovery and hidden→visible
  recovery remain unverified. Browser reduced-motion emulation and physical-phone
  QA also remain open as required pre-release follow-up. C1 local development
  is accepted for progression to C2; unperformed checks are not marked passed.
- `StudentRaceScreen.test.jsx` exercises the actual Mantine reduced-motion
  hook with initial and changing media-query preferences. It checks the Pixi
  presentation boundary, retained written reward, feedback expiry and
  unchanged authoritative state. This is component integration coverage,
  not browser emulation or a physical-phone result.
- Theme QA also exposed an existing nested `h2` React warning in the public
  settings modal. It is outside the race-renderer change and remains backlog;
  a fresh race-preview tab produced no console errors or warnings.

## Missing integration
- opponent vehicles
- teacher live page
- SSE
- results pages
- full auth server flows.
- race audio: planned immediately after the initial C2 opponent integration;
  engine/ambience, accepted-answer/combo/finish cues, mute and volume. The
  detailed ownership and acceptance contract is C2-A in the client plan.

S1-02 and server C2-01 supply authoritative `rank`, `playerCount`, `eventVersion`
and the full `opponents` roster (renamed from `nearbyPlayers`) in runtime
snapshots, including answer snapshots. The HUD consumes standing; the client still
needs to map opponents and render pooled opponents in C2.
The C1 completion checklist is in `CLIENT_IMPLEMENTATION_PLAN.md`; future
teacher/SSE/results/auth work does not belong to that single-player gate.

## Stale client state to clean

- live/results route constants exist without routes.

## Immediate client priority

```text
Closed local C1 development milestone → opponents using the existing S1-02 contract (C2)
→ race sound polish (C2-A) and carried-forward pre-release device/recovery QA
→ teacher live/SSE (C3)
```
