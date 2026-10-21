# Client Current State

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the implemented React/UI/game-rendering capabilities and remaining integration work

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
Local checkpoint, 2026-10-17 (C5-03): **C5-02 committed locally** as `f6b9878` on
`feature/C5-02-challenge-choice-energy` (not pushed), and **the rest of C5-03 implemented
locally on the same branch** (not yet merged to main): Safe progress ("question N of 3"
with pips) from the server's run, one-shot Turbo/Safe result moments (once per
`lastResult.challengeId`, never replayed after a refresh), result lines that name the outcome,
player-only kart thrusters on the art's own nozzles (Turbo success-only fire, Safe calm blue, one
burst per result), result effects, reused approved sounds, bounded timeouts for the runtime
requests and readable feedback colors in the light theme. Live QA passed on the local server
(race 161: every outcome, a reload mid-Safe and a missed offer; soak race 162: eight
players, a slow and a failed choice). Closeout 2026-10-18 (same branch, not yet merged to main): monkey
poses on the real kart bodies (Safe lounging with a can, Turbo leaning forward; eight colours,
player-only, preloaded shortly after the kart appears), no combo claims for challenge answers, a calmer Safe Perfect
effect, neutral Safe-complete copy, a clear sync-failed message, a proven lost-acknowledgement
path, and q90 WebP for the seven colour karts. Dedicated challenge sounds were added on
2026-10-19 (client quality package 2; see the audio matrix). Painted nozzle exhaust is integrated by the subsequent C5-03j visual pass: restrained
Turbo light, no Turbo star particles or filled ground disc, and a staged whole-kart pose
transition. Earlier live evidence (race 172) predates this pass; its final live/device acceptance
remains open. Latest C5-03k correction: Turbo waits in idle until a fresh accepted success;
no special movement burst or camera zoom. Both poses blend over 320 ms without squash or
transparent body dip; Safe ground-light alpha is 0.18. Claude's later attempt was fully
reverted before this repair (all 94 scoped files matched the prior review bundle).
Latest C5-03l Safe cleanup removes stars, golden rays and driver-height rings; steady blue
nozzle light is softened, result pulses ease in/out, and the mode aura fades with the pose.
Diana handles Turbo question sequence/difficulty on the server. See C5-03k/l/m in the plan.
C5-03m inherits renderer resolution/antialiasing during pose blending and returns Turbo to
idle in 160 ms, keeping Safe at 320 ms. Active server challenge slowdown adds dim nozzles,
an amber speedometer label and playful copy. Speed and effect lifetime remain server-owned.
Additional mode music is deferred; the existing audio system is unchanged by this pass.

Local checkpoint, 2026-10-17: **C5-02 Challenge choice and energy implemented** on
`feature/C5-02-challenge-choice-energy` (committed locally as `f6b9878`) on the merged
S4-02/S4-03 contract: the challenge mapper (finite offer clock, consistent run/result
counters), the question gate by server mode, the choice cards with the one HUD countdown, the
energy meter with its value, a choice controller that never replays a request and checks an
unknown outcome with one fresh race-state read, and bots that never re-send a failed choice.
Live QA passed on the local server (races 156–158: a real student browser, six bots and
simulated lost responses); DEV-route (`/dev/race?motionScenario=challenge`) screenshots are
mock data and are labeled so.

Checkpoint, 2026-10-08: **C5-03 presentation groundwork and the C5-01h slowdown
explanation implemented** on `feature/C5-02-03-gameplay-presentation` (merged in PR #78,
`main@84a4423`) —
built only on the merged S4-01 vocabulary: one shared question-panel surface, a Turbo/Safe
badge and accent on the same question component, the missed-challenge slowdown explained in
the question line, a player-only kart aura for the server mode, and `/dev/race` Turbo/Safe
scenarios. The server Challenge contract is now merged (S4-02 + S4-03, PR #77,
`main@6808d16`); C5-02 started from a contract audit of that code (see the 2026-10-17
checkpoint above).

Checkpoint, 2026-10-07: **C5-01 gameplay runtime merged** in PR #76 (`main@dd20140`) — the
client consumes the merged S4-01 contract: `snapshot.gameplay` is mapped once into
`runtime.gameplay` (forward-safe), the speedometer, the hover engine and the kart's visual
speed follow the server's effective speed, movement still comes only from
`movementUnitsPerSecond`, the question model keeps `gameplayContext`, and `/dev/race`
previews a slowdown and unknown future data.

Checkpoint, 2026-10-05: **C5-A audio complete**, merged in PR #75 (`main@91001d8`) —
approved music and sounds integrated for every current student and
teacher situation, one music owner per screen, the single student moment owner feeding the
renderer and the sound adapter, and a provenance record for every file. A final cleanup after
an independent audit made browser resource setup transactional, stops a fading track at once on
hide or Music OFF, holds moments that arrive before the renderer is ready, keys waiting-room joins
by the room's `playerId` and narrowed the engine API to its production path. Physical devices,
the projector in real fullscreen and listening on real speakers remain manual checks.

Checkpoint, 2026-10-04: **C5-A audio foundation implemented** (merged with C5-A in PR #75)
— one audio engine and settings store,
one `AudioProvider`, one shared sound settings UI in Public Settings, the student HUD and the
teacher projector; the client no longer infers BOOST from a speed rise. Real sounds (C5-A8)
wait for production audio assets. 1226 tests/137 files, lint and build pass; the controls and
the provider were checked in the browser (HE/EN, phone and desktop, keyboard, live bot race
154 on the projector).

Checkpoint, 2026-09-29: **C4 Results COMPLETE on the client** on `feature/C4-results` —
C4-A teacher Result Screen (`fd8dedf`), C4-B1 student progressive results engine
(`cba8056`), C4-B2 student results UI and C4-C results art, final assets and teacher name
isolation. 1121 tests/128 files, lint and build pass. Teacher results were reviewed live
(race 131) and student results with bot races (133/136/137); the C4-C closure ran fixture
QA at 320–1920 px, HE/EN, light/dark, and the final build passed live closure QA on
2026-09-30 (bot races 138–140, real student and teacher browsers). C5 is next once the
server S4-01 effect/event contract exists.

Checkpoint, 2026-09-24: **C3 teacher live race COMPLETE on the client** — C3-01 (live
route and authoritative live-state) and C3-02 (durable teacher SSE sync) merged in
PR #69; C3-03 (projector UI), C3-04 (eight production side-view vehicles, responsive
geometry, leaderboard density, brand stability), C3-05 (real jungle projector art),
C3-06 (UI art accents and title plaque), C3-07 (animated authoritative leaderboard,
rank tiers, waiting-room art preload) and C3-08 (live-route navbar breakpoint,
notice below the header, podium medals) are DONE. 851 tests/104 files, lint and build
pass; QA ran on 2/4/6/8-player races at six viewports plus a continuous width sweep of
the workspace shell, in both languages and both themes, and Shimon reviewed the live
projector. Release QA items: an overtake observed with bots, fullscreen → Esc →
fullscreen, reconnect without replayed pulses, phone rotation inside the workspace
shell. C4 Results is next.

Local checkpoint, 2026-09-13: **C2 core implemented and closed for PR review** on
`feature/C2-01-competition-truth-finish-arbitration` (4 commits ahead of `main`):
full opponents roster, shared local/opponent motion, pooled opponents by RacePlayer
ID, NEAR/MID/FAR density with lane-fit, static per-color vehicle art, student SSE
with polling fallback and proof-gated finish presentation. 530 tests/60 files, lint
and build pass; live two-player and eight-player browser QA on the final build passed
the closure scenarios (see `TESTING_AND_DEFINITION_OF_DONE.md`). Physical-device
acceptance and merge remain open; C2-A race sound is deferred.

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

- Art refresh, 2026-10-19/21 (local): five entry/student/dashboard WebP illustrations now show
  the game's own character and vehicle: the monkey in the blue helmet and yellow scarf on the
  green front-view hover kart of the race art, placed into the original scenes. Existing
  filenames, transparent dashboard variants and components are preserved. No changes to P3
  storage/font behavior. The student join and waiting heroes share one 4:3 frame and one focal
  point, so the monkey stays in place when the waiting screen replaces the join screen (the
  waiting art is cut to the join frame, 988×741). From tablet width the entry banner may grow
  to 36rem (26rem before), and the vertical focal points (35% landing, 33% join and waiting)
  keep the monkey's head in view on wide tablet and landscape banners, where the kart may slip
  under the card; phones in portrait and desktops are unchanged. The two dashboard greeting
  variants are 600×450 and 400×300, about twice and three times their 299×224 and 133×100
  display size; the dashboard loads both, 110 KB together. All five are built from their
  masters by a private deterministic pipeline (`docs/vision/entry-hero-source/`, local) and
  pinned by `entryHeroArt.test.js`.
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
  race-state; `sessionStorage` joinData is display cache only (since 2026-10-19 six allowlisted
  fields, never the raw join response, and an older full value is trimmed on its first read; see
  `BROWSER_CACHE_AND_STORAGE.md`, which also records the self-hosted fonts and every browser
  storage key).

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
- every server color key maps to its own static WebP (GREEN, PURPLE, RED, BLUE,
  ORANGE, PINK, YELLOW, CYAN) with identical crop, anchor and scale; the GREEN-master
  interim of 2026-09-05 is closed (C2, 2026-09-11). No runtime recolor.

### Student race visual feedback (C1-06E — done 2026-08-23; local revision accepted 2026-09-08)

- `useStudentRaceMoments` is the single moment owner; `EffectsLayer` draws the batches it
  receives and detects nothing itself. It plays procedural one-shots on the Pixi ticker: CORRECT /
  WRONG from the accepted answer feedback only, FINISH from `playerFinished`
  false→true only; BOOST only from an authoritative boost cue, which does not
  exist yet, so it never plays (a `targetSpeed` rise is not a boost)
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
- The thicket and new `jungle-verge-flowers-01.webp` were first packaged as lossless
  WebP with every decoded RGBA byte verified against their private generated
  PNGs; since 2026-10-19 both ship as quality-85 lossy WebP with byte-identical
  alpha (client quality package 1, 3,481,208 → 994,664 bytes together); artwork,
  dimensions and colors are unchanged. The flowers are 1774×887 pixels / 360,908 bytes;
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
- A fresh race-preview tab produced no console errors or warnings.

## Missing integration
- full auth server flows.
- audio manual checks (open): Android and iPad real devices, iPhone if available, the teacher
  projector in real Chrome fullscreen (sound popover included), listening balance on real
  speakers, and reconnect/interruption on a real deployment; everything else in C5-A is
  integrated.

## Opponents and live synchronization (C2 — implemented 2026-09-10/13)

- the full `opponents` roster (0..7, standing order) is consumed from race-state and
  answer snapshots through one snapshot accumulator ordered by (`eventVersion`,
  `snapshotAtEpochMs`); rank and count come from the server, never computed locally
- student SSE signals (`version`, `type`, `occurredAtEpochMs`) only invalidate and
  trigger guarded refreshes; the 2-second race-state poll remains the fallback
- local kart and opponents share one motion authority (`createRaceVisualMotionTracker`,
  5-second prediction limit); opponents are pooled by RacePlayer ID with
  hidden → entering → visible → exiting states and hysteresis
- NEAR/MID/FAR density 2/4/7 and lane-fit selection are presentation-only: an
  opponent is drawn only where its full lane step fits the zone side clearance and
  never moves along the track for visual convenience
- eight static per-color vehicle WebPs share one manifest and one vehicle visual
- finish presentation is proof-gated: crossings and runouts wait for the confirmed
  finish-order prefix from the server; an opponent first seen FINISHED never replays
- `npm run dev:bots` provides six online bots for manual multiplayer QA.
The C1 completion checklist is in `CLIENT_IMPLEMENTATION_PLAN.md`; future
teacher/SSE/results/auth work does not belong to that single-player gate.

## Teacher live race (C3 — COMPLETE 2026-09-24; C3-01/C3-02 merged in PR #69)

- `features/teacherLiveRace/`: the page only orchestrates; `useTeacherRaceLive` owns
  the authoritative GET, the event stream and recovery; the pure engine applies
  version-gated events through one event registry, and roster contract violations
  (capacity, repeated ids or lanes) turn into an authoritative re-read
- a pure view model feeds the projector: lanes by `laneNumber` on an always
  left-to-right track, leaderboard in server order with server tie ranks
- elapsed time comes from a server-clock anchor captured when the live-state response
  arrives (`serverTimeEpochMs` + `performance.now()`), never the teacher's wall clock
- one Tailwind style owner with container queries (compact, medium, three-column
  projector); fullscreen targets the projector surface through Mantine
  `useFullscreenElement` and hides when unsupported
- shared owners reused by C3: `shared/live` stream and version classifier (student
  stream too), `shared/components/stats/StatCard` (dashboard too),
  `shared/raceVehicles/raceVehicleIdentity` (the only vehicle color owner, the student
  vehicle manifest reads it) and `shared/responsive` preferred-device profiles with a
  non-modal, per-session dismissable notice (teacher projector and student race)
- vehicles: a Teacher-specific manifest maps the eight server `vehicleAssetKey` values
  to side-view WebPs under `assets/game/teacherRace/hoverKarts/` (384×226, derived from
  one approved GREEN master by a deterministic recolor pipeline; Student rear-view art
  is never reused); an unknown key renders the colored CSS marker
- vehicle geometry has one source (asset aspect ratio, compact/wide heights, edge gap);
  width and rail inset are derived, so the kart stays inside the strip at 0% and 100%
- movement is target-only: a 1000 ms linear tween to the latest server position, no
  prediction; immediate under reduced motion
- leaderboard density is responsive: narrow side panels hide streak, then progress,
  through a container query; rank, name, score and status always stay
- disconnected players mute the label and status while the kart stays readable
- the shared brand lockup keeps a stable shuffle (no restart on parent re-renders, no
  layout shift while scrambling, 10 s default / 30 s on the projector); the projector
  shows its own logo only in fullscreen, never in the footer
- world art: one art owner (`teacherRaceProjectorArt.js`) for the jungle backdrop,
  START/FINISH signs, verge and UI accents; translated labels and the race title stay
  DOM text over the art; dark mode tints the same art; decoration steps down on narrow
  layouts; the projector fills the workspace height through the AppShell variables
- the leaderboard renders the server roster order untouched; rows slide by
  `racePlayerId` identity (320 ms ease-out, instant under reduced motion); ranks 1/2/3
  get gold/silver/bronze row tiers and medals from the server rank only, ties share
  them
- `useFreshFeedItem` is the "something new happened" seam (lightning pulse today,
  future sound cues); the connection footer shows the Wi-Fi art only while LIVE
- the waiting room preloads the projector and vehicle art once and never blocks Start
- the workspace shell collapses its navbar at `lg` on the live route (`sm` elsewhere)
  from one breakpoint key; the preferred-device notice sits below the header.

## Results (C4 — COMPLETE 2026-09-29)

- teacher (`features/teacherRaceResults/`): lazy route `/teacher/races/:raceId/results`
  inside the workspace shell (projector `lg` breakpoint); one final-results read through a
  contract mapper; the view model never sorts, ranks or chooses winners, so standings,
  ties, winners (none, one or many) and awards (including disconnected recipients) stay
  exactly as the server sends them; dashboard and All Races open FINISHED races here and
  the finished projector offers an explicit link; 404, 409 (not ready, with retry) and
  network/contract errors have their own states
- student (`features/studentRace/`, same `/student/race` route): after the own finish
  ceremony the screen becomes results — WATCHING (groups RANKED/CONFIRMING/RACING/OUT) and
  FINAL (server rank cohorts, ties kept); the one student EventSource stays open as a
  passive watcher, heartbeat and gameplay stay stopped, a 5-second race-state poll is the
  fallback, and unproven finishers are proven through the existing single-flight
  finish-arbitration request with per-player stagger and backoff, never after the race ends
- results art: one owner (`shared/raceResults/raceResultsArt.js`) for
  `assets/game/raceResults/`; front hero karts per server `vehicleAssetKey`
  (`shared/raceVehicles/raceVehicleFrontArt.js`) stand on the podium in
  `shared/components/raceResults/RaceResultsStage`; lists keep the side-view karts
- one placement owner for every race surface, `RacePlacementBadge`
  (`shared/components/raceRank/`): callers pass only `rank` and `placementArtEligible`
  (finished in results, not disconnected while live) and one resolver draws the medal art
  for places 1–3, the wooden badge around a real DOM number for 4+, or a quiet
  lane-colored number; the Teacher Live leaderboard, the student race HUD rank chip, both
  results lists, the student hero and the winner cards all use it (the old CSS medals are
  gone) and compact rows keep one height
- stat icons: the score star and the streak flame in the race HUD and the student results
  stat cards (`StatCard` `art`); the HUD flame stays dim until a combo
- award emblems: trophy (highest score), target (most correct answers), flame (best streak)
- names: student results and teacher results isolate each name in `<bdi>` (per recipient in
  award lists), so a long Latin name in RTL keeps its beginning and ends with the ellipsis;
  the live projector leaderboard does the same (lane labels sit on the always left-to-right
  track and were already correct).

## Audio (C5-A — complete 2026-10-05)

- `shared/audio/audioEngine.js` is the only audio owner (module singleton, no feature
  creates an `AudioContext`): lazy context inside the unlocking gesture, Music and SFX
  buses, registry, loader, cue cooldown/voice limits, loop channels, music player with owner
  tokens and a 0.4 s cross-fade (hiding the page or Music OFF stops a fading track at once);
  screens use `useSceneMusic(key, gain)`. The barrel exports only `audioEngine`,
  `useSceneMusic`, `AUDIO_KINDS` and `AUDIO_LOOP_CHANNELS`; play results and engine states stay
  internal to `shared/audio`
- failures: a browser failure (context or bus setup, music element routing, `play()`, decode,
  autoplay) stays silent inside `shared/audio` and gameplay continues; a context or music
  element that fails while being built is released, and the next gesture or sync builds a
  fresh one; registry and catalog errors still throw. Audio has no error codes, notifications
  or retry loop of its own
- `shared/gameAudio/gameAudioCatalog.js`: every physical sound once (key, kind, fingerprinted
  URL, gain, cooldown, voices); `AudioProvider` registers it at import; files under
  `client/src/assets/audio/`, provenance in `AUDIO_ASSET_PROVENANCE.md`
- `stores/audioSettingsStore.js` (`qw-audio`): Music OFF and Sound effects ON by default,
  volumes stored for later, per-field fallback for invalid stored values
- `app/providers/AudioProvider.jsx` (once, in `AppProviders`): settings → engine,
  activation gestures → unlock (kept after unlock for Safari), hidden/visible →
  suspend/resume through `useBrowserLifecycleEvents`; never disposes the engine
- `AudioSettingsControls` + `AudioSettingsButton` (`shared/components/publicSettings`):
  the same Music/Sound effects switches in Public Settings, the student HUD telemetry row
  and the teacher projector header; the projector popover stays inside the fullscreen
  surface
- feature adapters map presentation to keys: `studentRaceSounds` (moments, combo tiers,
  engine rate 0.8–1.4 from the server speed), `useStudentRaceSound`, `useWaitingRace` (start
  cue), `StudentShell` (game music), `teacherRaceSounds`, `useTeacherRoomSound`,
  `useTeacherLiveRaceSound`, `useTeacherRaceRoom` (start cue)
- student moments: `useStudentRaceMoments` hands one batch to Pixi and to `studentRaceSounds`;
  a batch that arrives before the Pixi renderer exists waits in `PixiStudentRaceCanvas` and is
  drawn once when the renderer starts (an unmount drops it)
- teacher cues: the waiting-room pop compares roster refreshes by the room's `playerId`; the
  projector cues only feed items that arrive after the page opened (the feed on screen at mount
  is a baseline), and a race-finished cue replaces a last player's finish in the same update

Current audio matrix:

| Context | Music | Sound effects | Loop |
|---|---|---|---|
| Landing, teacher dashboard and other workspace pages | none | none | none |
| Public Settings dialog | Music / Sound effects switches only | none | none |
| Student join | game music (`music-game-main`, soft on phones) | none | none |
| Student waiting room | game music, same track without a restart | race start, only on an observed WAITING to PLAYING change | none |
| Student race | race music (`music-race-main`, soft on phones) | correct; combo in three tiers from the server streak (2+, 5+, 10+) instead of correct; wrong; time up; finish; challenge offer instead of the correct cue it arrives with; Turbo armed once the server holds the run; Turbo launch, Turbo fizzle, Safe complete (combo tier 1) and Safe perfect instead of the answer cue of their batch | hover engine while gameplay is ready and the player races; rate from the server speed |
| Student finish ceremony | race music continues | finish (once) | engine stops at the finish |
| Student results | game music (`music-game-main`, scene gain 0.4, below the waiting room) after the race music fades out | none | none |
| Teacher waiting room | game music (projector level) | one soft pop per roster refresh that brings new players; race start on a successful Start | none |
| Teacher projector | race music (projector level, above a phone) while the race runs | player finished (at least 400 ms apart); race finished (once) | none |
| Teacher answers and rank changes | none, by decision | none | none |
| Teacher results | none | none | none |

## Gameplay runtime (C5-01)

- `features/studentRace/runtime/mapStudentRaceGameplay.js` maps `snapshot.gameplay` inside
  `applyRaceSnapshot`, the one entry of race-state, answer and finish-arbitration snapshots;
  `runtime.gameplay` = `{ mode, effectiveSpeed, activeEffects }` is normalized server truth
- forward-safe: a future mode, effect type or source is kept but presents nothing; one
  malformed effect is dropped alone; a missing or malformed `gameplay` object falls back to
  `NORMAL` with no effects; the race snapshot itself is never rejected for it
- speed ownership: `player.speed` is the earned base speed, `gameplay.effectiveSpeed` the
  effective server speed and `visual.targetSpeed` the one presentation speed (the effective
  speed, or the base speed when the server sent none), read by the speedometer, the
  hover-engine rate and the Pixi bob/dust; `visual.movementUnitsPerSecond` is the only
  movement rate
- the question model keeps the server's `gameplayContext` (missing → `NORMAL`); the question
  panel reads it for the Turbo/Safe presentation (see below)
- `/dev/race?motionScenario=slowdown|future-effect|future-mode|turbo|safe` previews a
  server-shaped slowdown (3–8 s, ×1.2 → ×0.9), the Turbo and Safe modes and unknown future
  data through the same mapper
- deferred on purpose: an effect-end refresh timer (race-state already polls every 2 s while
  playing)

## Gameplay presentation (C5-03 groundwork, C5-01h)

- one presentation table, `features/studentRace/config/raceGameplayPresentationConfig.js`:
  per server variant (`TURBO_TRIAL`, `SAFE_RUN`) the icon, the i18n title/description keys and
  the kart aura (color, strength, pulse period); React and Pixi read the same table and an unknown
  variant presents nothing; DOM colors stay CSS theme tokens chosen by `data-gameplay`
  (`styles/studentRaceGameplay.css`: Turbo `--qw-warning`, Safe `--qw-secondary`)
- `components/StudentRacePanelSurface.jsx` is the one owner of the bottom panel geometry
  (extracted unchanged from the question panel); the mode accent is a 4 px inset shadow, so a
  NORMAL panel keeps its exact height, padding and card shadow
- the same `StudentRaceQuestionPanel` presents NORMAL, Turbo and Safe questions: a Turbo or
  Safe `gameplayContext` replaces the instruction with the mode badge
  (`StudentRaceGameplayBadge`: icon + name, never color alone); a future context keeps the
  plain instruction
- C5-01h: an active `SPEED_SLOW` effect whose source is `CHALLENGE_TIMEOUT` explains itself in
  the question's stable status line ("no challenge chosen in time — short slowdown"); answer
  feedback and sync states keep priority; nothing is inferred from speed
- `runtime/studentRaceGameplayMode.js`: pure helpers for the mode → question-context table and
  the missed-challenge slowdown check
- the player kart (`PlayerKartLayer`, not the shared vehicle base, so opponents are untouched)
  draws one ground aura between the shadow and the kart: drawn once, recolored by tint,
  additive blending so it reads as a glow on any road color; hidden for NORMAL,
  CHALLENGE_CHOICE and unknown modes; Turbo and Safe stay steady (Turbo alpha 0.12 after C5-03j)
- later local work: painted exhaust and restrained speed lines (C5-03j); the monkey poses,
  the thruster glow, the result moments and Safe progress are C5-03 (see below). The Challenge
  choice itself is C5-02 (next section).

## Challenge choice and energy (C5-02, committed locally as `f6b9878`)

- `runtime/mapStudentRaceChallenge.js` maps `gameplay.challenge` once (energy, threshold,
  offer, run, last result); a broken part drops only that part (`mapOrNull`), the offer
  carries the snapshot's finite `serverClockOffsetMs`, and run/result counters must be
  consistent (resolved ≤ total, correct ≤ resolved)
- the page asks for a question only in a question mode (`isQuestionGameplayMode`) and pairs
  the answer input with the mode (`isQuestionForGameplayMode`); the question and answer hooks
  are unchanged, and the cards appear only after the answer feedback dwell
- `hooks/useStudentRaceChallenge.js` owns the choice: one request per tap (single flight),
  mutation tokens, a deadline lock from the shared `getQuestionRemainingMs` checked by timer
  and at tap time, and phases (`STUDENT_RACE_CHALLENGE_PHASE`). A failed or lost response is
  never replayed: one `readAuthoritativeRaceState()` read that starts after the failure
  decides — fresh state with a run follows the run; the same offer still open allows only the
  first choice again (the server replays it if it already landed); a failed read offers a
  manual "Try to sync". Session and reconnect failures stay with the session gate and the
  reconnect check
- reliability bounds (2026-10-17 audit): the choice POST and the check read carry their own
  request timeouts (`STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs` 4 s,
  `challengeCheckTimeoutMs` 3 s; per request — the shared HTTP client has no global limit, and
  the other runtime calls got their own bounds in C5-03). A POST
  timeout is an unknown outcome — checked, never re-sent; a read timeout ends in the manual
  sync. Only a read that landed in the race state allows the same-choice retry; a stale or
  invalid read leaves the manual sync. A failure that arrives after the screen moved on (newer
  state, finished race, reconnect, unmount) starts no late read
- `useStudentRaceSynchronization.readAuthoritativeRaceState()` is the one awaitable race-state
  read; it goes through the normal ingest (identity + freshness), so nothing bypasses
  `applyRaceSnapshot`, and returns `STUDENT_RACE_STATE_READ` (`current` / `stale` /
  `invalid`; network failures throw) so an HTTP 200 alone never counts as proof
- `components/StudentRaceChallengePanel.jsx` renders the server's choices inside
  `StudentRacePanelSurface` with art from `config/raceChallengeArt.js`; status copy never
  claims a failure it cannot know; the HUD shows one countdown (the offer's) and hides the
  question timer; an unreadable offer shows a calm sync line with a manual sync button
- the energy meter lives in the HUD progress column (NORMAL mode only, clamped to the
  threshold, `aria-valuetext`) with a visible `75/100` value; it fits at 320 px
- shared extractions: `StudentRaceInlineRetryButton` and `STUDENT_RACE_PANEL_STYLES.statusLine`
  (question and challenge panels)
- bots: `scripts/devRaceBotChallenge.mjs` (`--challenge=random|turbo|safe|none`) sends one
  request per offer, never re-sends a failed one, and counts only confirmed choices

## Challenge results, Safe progress and thrusters (C5-03, local, not yet merged to main)

- pure selectors in `runtime/studentRaceGameplayMode.js` read only server data:
  `selectSafeRunProgress` (current = resolved + 1, only while the served Safe question and the
  Safe mode agree), `selectChallengeResultOutcome` (the run's `lastResult` once the mode moved
  on and the served question still carries the run's context) and
  `selectChallengeSlowdownSource` (`CHALLENGE_TIMEOUT` or `TURBO_FAILURE`)
- Safe progress sits beside the Safe badge in the question's status line: "question N of 3"
  and three pips (`.race-safe-pip[data-done]`, decorative). After a Safe timeout the progress
  can trail the server by up to one 2 s poll, because the question DTO carries no run index
- result moments: `deriveStudentRaceMoments` adds `TURBO_SUCCESS` / `TURBO_FAILURE` /
  `SAFE_COMPLETE` / `SAFE_PERFECT` once per `lastResult.challengeId` and player identity; the
  first observation is a baseline, so a refresh or reconnect never replays a result; FINISH
  still outranks everything; the seen-id sets are bounded (64)
- the answer feedback names the result (`gameplay.result.*`; ✓/✕ still mark the answer itself);
  a Turbo failure slowdown explains itself ("The turbo fizzled — short slowdown")
- names and copy (HE/EN): Turbo Rush / טורבו־ברק and Banana Cruise / שיוט בננה; a choice that
  is still saving after `challengeSlowSubmitMs` (1.5 s) swaps to a playful "still checking"
  line by CSS alone (`.race-status-swap`)
- thrusters: `pixi/vehicles/KartThrusters.js` with `config/kartThrusterConfig.js`. The kart
  manifest records the art's measured rear-nozzle centres and radius (identical on every
  color); `artPixelToKartLocal` maps them like the art sprite. Player only, inside the bobbing
  kart, above the art; drawn once per palette, animated by alpha and scale. The Turbo question
  keeps the original nozzles; only a fresh server `TURBO_SUCCESS` plays the painted exhaust
  (`studentRaceEffectManifest`; a small code-drawn flame only when that image fails to load).
  Safe: calm blue; a server slowdown dims the nozzles; NORMAL, choice and unknown
  modes keep the original art. One burst per result (Turbo flare, failure sputter, Safe settle
  pulses); FINISH stops a burst; reduced motion keeps a steady glow and skips bursts;
  placeholder karts get none
- effects: `pixi/effects/drawChallengeResultEffect.js` (four deterministic drawers, durations in
  `raceAnimationConfig`); sounds (2026-10-19): `TURBO_LAUNCH`, `TURBO_FIZZLE` and `SAFE_PERFECT`
  for their results, Safe complete keeps `COMBO_TIER_1`, and a result replaces the answer cue of
  the same batch. `deriveStudentRaceMoments` adds a `challenge-offer` moment for a new `offerId`
  and a `turbo-armed` moment for a new Turbo `run.challengeId` (sets of seen ids, the first sight
  of a race or player is a baseline, the finish silences both); the offer cue replaces the
  correct-answer cue of its batch in sound only, and the visual answer effect stays
- runtime request bounds: `RACE_PLAYER_REQUEST_TIMEOUT_MS` in `api/racePlayerApi.js` —
  race-state, current question, answer and finish arbitration 5 s, heartbeat and reconnect 8 s.
  Each caller already recovers from a network error (keep the question and retry, refresh the
  question, reconnect, retry the arbitration loop), so a stalled network no longer freezes the
  panel until a reload. The join stays unbounded: a lost join response must not invite a retry
  that hits "name taken"
- contrast: feedback lines take their tone from `.race-panel-tone[data-tone]`; the light theme
  darkens the bright brand tones (4.9:1 and more, measured), and the card description is mixed
  toward the body text (4.5:1 and more in both themes)
- the DEV preview question keeps the context it was served with, like a server question, so
  `/dev/race?motionScenario=challenge` shows the result lines
- monkey poses (2026-10-18): `pixi/vehicles/KartPoseArt.js` + manifest `poses`
  (`SAFE_RUN`, `TURBO_TRIAL`) per colour. Each pose image is the shipped colour image with only
  the zone above the cockpit rim replaced by the candidate monkey (aligned, its paint recoloured
  with the kart recolour pipeline); 0 visible pixels change in the kart body, so the anchor,
  size and nozzle centres are identical. Only the player's kart uses them. The player's two poses
  load and upload to the GPU about 1.5 s after the kart art appears (`kartPoses` in
  `raceAnimationConfig`); they and the painted exhaust then stay on the GPU for the whole race
  screen (`StudentRaceRenderer`'s prepare step exempts only these sources from Pixi's 60 s GPU
  collector; Pixi frees them with the renderer), so a late Turbo or Safe does not upload them
  again; a failed one retries at most twice, 5 s apart, never offline; a pose
  blends in over 320 ms and returns from Turbo in 160 ms on an isolated surface
  (`KartArtCrossfade`, the shared body stays opaque); the blend filter is warmed up in the same
  quiet moment, so the first Turbo win does not stall on compiling it; reduced motion swaps at
  once; the idle art shows until a pose is ready and again afterwards, and a late or failed load
  never shows a stale pose. Opponents are unchanged
- challenge answers: the answer feedback carries its served `gameplayContext`; for Turbo/Safe
  questions the reward chip shows the server points without a combo or streak line, and the
  answer effect and sound use the plain correct tier, because the server keeps challenge answers
  out of the streak (`isChallengeAnswer`)
- Safe copy: `SAFE_COMPLETE` reads "Cruise finished — keep rolling!" (✓/✕ still mark the last
  answer); only `SAFE_PERFECT` celebrates. The choice sync failure is a plain error message
- Safe results (C5-03l): no stars, rays, nozzle halos or driver-height rings. One shallow blue
  ground ripple (peak alpha 0.16 complete / 0.26 perfect), plus a contained blue nozzle pulse
  (550 / 800 ms, opacity capped at 0.45 / 0.65). The steady Safe nozzle light is capped at
  0.45. The mode aura fades in/out over 320 ms and settles immediately under reduced motion.
- Turbo timing (C5-03k): the question keeps the idle art and has no fire. Only a fresh server
  `TURBO_SUCCESS` moment holds the launch pose for 1.3 s and plays the 1.1 s flame. Finish,
  a new offer, another mode or reduced motion cancels the hold. No camera zoom or special
  movement burst: +80 uses normal authoritative interpolation (24 units/s correction cap).
  Both pose directions blend for 320 ms on an isolated surface; common body pixels stay
  opaque, scale stays fixed, and an interrupted return reverses continuously. A challenge
  result replaces the answer effect and sound of the same batch. Earlier performance
  measurements predate this final pass; physical-phone performance must be checked again.
- lost acknowledgement: `pages/__tests__/StudentRacePage.lostAnswer.test.jsx` drives a fake server
  that commits the answer and then loses the response — one POST, the next server question, the
  server score once, no feedback for the lost answer
- seven colour karts re-encoded as q90 WebP like the green one (about 390 KB to 88 KB each,
  alpha identical, 41–44 dB at display sizes)
- painted Turbo exhaust (C5-03j): one shared 12 KB transparent WebP, no star particles or filled
  ground disc; fire appears only for a successful result, with a small code fallback on load failure.
  No new server speed effect; final live/device acceptance remains open
- dedicated challenge sounds: added 2026-10-19 (client quality package 2, see the audio matrix)

## Stale client state to clean

- none recorded; the results route constant now backs the C4 Result Screen route.

## Immediate client priority

```text
C5-A audio merged (PR #75); S4-01 contract merged (PR #74); C5-01 merged (PR #76);
S4-02 + S4-03 Challenge contract merged (PR #77)
→ C5-03 presentation groundwork + C5-01h slowdown explanation merged (PR #78)
→ C5-02 Challenge Choice committed locally (f6b9878)
→ C5-03 results, Safe progress and thrusters implemented locally, live QA passed (review, then
  the commit); 2026-10-18 closeout and Turbo polish on top, live QA race 172 (23/23)
→ C5-03k/l success-only launch, normal catch-up, clean Turbo/Safe blending and restrained Safe results:
  local QA; final live/device QA open
→ S4-04 handoff to the server
→ meanwhile: the pre-release device/recovery QA
```
