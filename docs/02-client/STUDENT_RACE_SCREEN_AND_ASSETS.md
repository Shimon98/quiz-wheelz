# Student Race Screen and Asset Contract

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the complete UI-10 status, rendering architecture, road zones, vehicles, metadata and asset workflow

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Current status

Done:

```text
UI-10A runtime contract
UI-10B API wrappers/shared statuses
UI-10C asset manifest/config
UI-10D manual Pixi shell
UI-10E local runtime
UI-10F perspective world layers
UI-10F-1 unified projection/track lock
UI-10F-2 road alignment/depth zones
UI-10G layout contract
```

Done: C1-01 bootstrap, C1-02 question panel/timer, C1-03 answer loop,
C1-03M continuous authoritative movement, C1-04 HUD, C1-05 presence/reconnect,
C1-06A–C vehicle identity + manifest/loader + real GREEN static sprite,
C1-06E server-driven correct/wrong/boost/finish Pixi feedback.

Next:

```text
C1-06F world/FAR/road/side ground/dense scenery/NEAR continuity — ACCEPTED (old MID verge off)
F-8 motion presentation — IMPLEMENTED / ACCEPTED; separate NEAR art remains optional
Correct/combo reward + speedometer revision implemented; F-9/G validation IN PROGRESS
C2 opponents — after the C1 gate, using the existing S1-02 snapshot contract
```

The old “H is blocked” note is stale because the server race-state endpoint is now
merged.
Shimon accepted the current world design. Preserve this baseline while completing
the feedback pass. Acceptance does not close C1: current live-flow and physical-device
QA remain separate gates in `CLIENT_IMPLEMENTATION_PLAN.md`.

## Renderer ownership

```text
React:
question panel
answer buttons
HUD
loading/error/reconnect
accessibility/i18n

PixiJS:
road
jungle layers
player/opponent hover karts
finish line
dust/boost/mud/effects
frame interpolation
```

The renderer is created once. React pushes target runtime state through an
imperative bridge. React must not rerender for every animation frame.
`createRacePerspective`, `projectSceneryPlacement` and `studentRaceMotion`
own projection, scenery placement and drawing motion in JavaScript modules;
these calculations do not belong in JSX.

The world is revealed after layer readiness settles, avoiding a partial
road-only scene while scenery loads. Rejected asset loads use the existing
fallback. Pending loads also fall back at the 10-second deadline owned by
`worldArtConfig.loading.timeoutMs`. Deadlines are cleared on settlement;
late results cannot mutate textures. Destruction before readiness cannot
reveal a stale scene.
Scenery and the upright finish gate are direct children of the same sortable
world container, ordered by projected ground depth. Surface containers
remain beneath them; kart/effects retain their separate foreground owners.

## Track model

```text
Player-Centered Wide Mud Track
+ Server Lanes as Invisible Lateral Slots
+ Depth-Aware Visibility
```

Rules:

1. One visually continuous muddy road.
2. No lane lines or lane numbers.
3. Player kart stays bottom-center.
4. My server lane is normalized to center.
5. Opponent x-position uses `laneDelta`.
6. Screen depth, scale and draw order are pure functions of server position.
7. Hiding/fading is allowed; moving a vehicle forward/backward to declutter is not.
8. The finish line and all future props use the same projection.

## Logical depth zones

The road is not split into three images. It is one continuous projection with three
behavior zones.

```text
far:  0.00 → 0.35
mid:  0.35 → 0.70
near: 0.70 → 1.00
```

### Near

- road wider than the width unit (the viewport on phones; wide frames keep
  phone proportions and may show the edges)
- player hover kart
- at most a few large opponents
- large dust/mud/leaf props
- fastest apparent movement.

### Mid

- road edges begin to appear
- bushes, flowers, rocks, signs
- more opponents
- primary speed-reading zone.

### Far

- full road width and vanishing point
- distant jungle/waterfall/mountains/clouds
- small opponents/silhouettes
- finish line first becomes visible
- slow apparent movement.

## One projection

All track objects use one projection owner, created by `createRacePerspective`:

```js
perspective.projectTrackObject(relativeDistance, lateralRatio)
```

The camera now uses reciprocal distance: projected size is proportional to
`1 / (cameraDistance + relativeDistance)`. `cameraDistance` derives from the
existing near/far road widths and the 150-unit view window. `distanceAtDepth`
is the inverse used by road, ground and the optional MID mesh for texture
coordinates. The road silhouette and depth-zone thresholds are unchanged;
world-distance placement now produces much stronger apparent acceleration
near the driver. No zone has a separate movement multiplier. The distant
panorama remains a static horizon; projected distant trees approach slowly.

`lateralRatio` is measured in road half-widths: zero is the center and
plus/minus one are the road edges. Future opponents map server lane deltas
to this coordinate without changing server depth. Current result:

```js
{
  visible,
  depth,
  y,
  roadHalfWidth,
  x
}
```

Do not implement independent math inside each layer. The default projection
window remains depth 0–1. Scenery can pass an explicit `{ maxDepth }` as a
third argument to keep drawing a signed distance behind the camera until
the full sprite exits. This opt-in tail does not change road geometry,
the logical depth zones or the future opponent projection window.

`projectSceneryPlacement` derives sprite width and height from this shared
projection, asset proportions and placement scale. It also owns bounds
culling and the per-band entry fade. Tree crown bounds remain outside the
road; low verge bounds overlap at most the outer 26% of a road half-width.
This is a geometric limit, not a promise of opaque coverage at every leaf
tip. The flowering verge uses metadata `anchorY` 0.94 to align its dense
base; full-frame bounds culling includes the portion below that anchor.
Scenery does not fade at depth 1: a crown may remain above the question
panel while its base travels behind it, until its full bounds exit the
viewport. Bounds are tested against the whole frame, including the area
behind the React panel.

The fixed population remains 588 sprites. Each composition band owns its
repeat length in world pixels: thicket/rocks 4800, canopy 3600, trees 3000,
undergrowth 2700 and verge 2400. All subtract the same camera world offset.
The signed repeat window begins at each silhouette's complete exit distance;
its far entry fade adapts to the band length. Shorter repeats preserve dense
near foliage without adding sprites or recycling a visible crown.

## Asset metadata

Every repeating world asset should be described by metadata instead of hardcoded
branches.

```js
{
  assetKey: "jungleRock01",
  category: "depth-projected",
  allowedZones: ["mid", "far"],
  lateralRange: [-0.9, 0.9],
  baseScale: 1,
  anchorX: 0.5,
  anchorY: 1,
  spawnWeight: 2,
  minSpacing: 0.12,
  canMirror: true
}
```

Canonical categories:

```text
static-background
screen-fixed
depth-projected
track-projected
react-overlay-decoration
```

## Asset manifest rules

- renderer references keys, never file paths
- replacing placeholder art requires no code change
- no text in images
- WebP by default; AVIF where it wins
- alpha preserved where required
- trim transparent margins
- no duplicate key
- folders are created only when first used.

World-art model (C1-06F, locked): existing raw FAR/road/scenery art stays in
the private vision area and is processed deterministically (alpha lift,
seam heal, WebP) into this tree. The new thicket and flowering verge trials
below use lossless WebP encodings of their private generated PNGs.
Static sky/ground gradients sit behind
a static FAR horizon sprite anchored to the horizon;
projected surfaces (ground plane, road, optional MID verge) and projected
scenery sprites scroll in `worldOffset`
lockstep through the ONE projection; only future screen-space layers
(NEAR strips, canopy) get movement multipliers; `viewDepthZones` is never
an art setting.

Side-ground sampling uses `worldArtConfig.ground.tilesPerRoadWidth` 0.65.
Road and ground both use 48×8 meshes with inverse-distance texture sampling.
Their repeat lengths are 960 and 710 world pixels respectively, preserving
readable near-surface details with the reciprocal projection. The disabled
MID strip also uses the same inverse and a 480-world-pixel repeat. Graphics
fallback vegetation and road details use this camera mapping as well.

`worldArtConfig.road.surfaceInsetURatio` is 0.12. `buildRoadMeshData` reuses
the projected strip's horizontal sampling hook to map U 0.12–0.88 across
the existing road vertices. This excludes the source's baked green edge
strips, so the muddy surface reads wider without narrowing the road or
editing the image. Separate projected verge leaves conceal the boundary
with the 26% overlap limit above. Longitudinal V phase still derives from
the shared world offset; texture repeat lengths are calibrated above.

The road opts into `ProjectedTextureStrip` edge feathering through
`worldArtConfig.road.edgeFeatherHalfWidthRatio` 0.04. The outer 4% of each
road half-width (2% of full road width per edge) blends into the ground.
`createStripEdgeShader` composes Pixi's public shader bits and uses separate
edge coordinates, so cropping or scrolling the texture does not move this
transition. Mesh geometry and the default ground/MID strip behavior stay
unchanged. The strip releases its own geometry buffers and shader at
teardown while retaining the shared cached textures.

Suggested target:

```text
assets/game/studentRace/
  backgrounds/
  road/
  hoverKarts/
  effects/
  finish/
  scenery/
  overlay/
```

### Rear thicket asset (accepted world, 2026-09-07)

`client/src/assets/game/studentRace/scenery/jungle-thicket-01.webp` is a
generated transparent cluster that fills the forest interior behind
individual trees. It joins the existing two trees, palm, two rocks and
bush in `sceneryConfig.props`; with the flowering verge below, all eight
assets share `SceneryLayer`.
The runtime WebP is 1254×1254 pixels and 2,136,844 bytes (2.14 MB).
It was encoded losslessly from the generated PNG, with every decoded RGBA
byte verified as identical. No resizing, recoloring or artwork edits were
applied. The 2,835,611-byte source PNG stays private at
`docs/vision/world-art-source/jungle-thicket-01.png`; only the WebP is
consumed by `sceneryConfig`. It belongs to the accepted world composition;
physical-phone performance remains a required pre-release check carried from C1-06G. Its filename and URL
have one runtime owner in `sceneryConfig`.

The FAR panorama remains the distant horizon. The thicket, varied canopy
heights and smaller foreground plants form the transition to it while
preserving the wide road for future competitors. Gradual per-band entry
opacity blends those objects into the existing FAR; the FAR image and road
geometry are unchanged. The thicket belongs to the rear band; low verge
placements now mix shrubs and the flowering clump described below.

<details>
<summary>Generation prompt — rear jungle thicket</summary>

This exact prompt produced the private source PNG named above; lossless
WebP packaging changes only its storage format.

```text
Use case: stylized-concept. Generate one production-ready transparent PNG sprite for a colorful polished 2.5D jungle racing game. This is a NEW isolated rear jungle thicket cluster asset, not a scene screenshot. A dense irregular grouping of three overlapping broadleaf tropical trees of unequal heights, shadowy teal-green foliage mass below their crowns, layered ferns, a few vines. Dense leafy silhouette with almost no sky holes in its central body; hide most lower trunks in thick plants, organically scalloped leafy bottom, NO flat ground platform. Warm yellow-green sunlit leaf tips on upper right, rich forest green and deep teal interior. Painterly rendered family game style, detailed readable leaf clusters, dimensional shading, no black outline. Front view at human eye height, whole single cluster visible and centered, approximately square silhouette, tallest crown slightly off-center. Actual transparent alpha outside silhouette, not a checkerboard or colored backdrop. No road, no horizon, no mountains, no sky, no border, no UI, no writing, no vehicle. Natural full foliage body reaching the bottom edge with tiny transparent safety margin; narrow margin around entire silhouette. It will sit BEHIND existing individual trees along both sides of a continuous muddy race road. Keep shadowed underside dense so it fills gaps between tree trunks.
```

</details>

### Flowering verge asset (accepted world, 2026-09-07)

`client/src/assets/game/studentRace/scenery/jungle-verge-flowers-01.webp`
is a low, dense roadside clump generated with the built-in image generator.
Its lossless RGBA WebP is 1774×887 pixels and 1,344,364 bytes, with decoded
pixels verified identical to the generated source. No crop, resize or color
edit was applied. The private source is
`docs/vision/world-art-source/jungle-verge-flowers-01.png`.

`sceneryConfig.props` owns its asset URL, width and `anchorY` 0.94. About
one third of the 128 verge placements per side use flowers, and the
undergrowth band also uses them. Dense low foliage, the projected floor and
the narrow road feather jointly soften the road/forest seam. The asset
belongs to the accepted world composition; physical-phone performance QA remains open.

<details>
<summary>Generation prompt — flowering roadside verge</summary>

The generation prompt for the private source PNG:

```text
Create one production game sprite for QuizWheelz, a polished colorful hand-painted 2.5D tropical jungle racing game. Single low roadside undergrowth clump, approximately twice as wide as tall, composed of overlapping deep emerald and teal broad leaves, a few arching fern fronds, two small coral-orange tropical flowers off center, and little lime-green shoots. Asymmetric natural silhouette, solid dense dark foliage along the ground-level base to conceal a road-to-forest seam. Front-facing, slightly looking down from a kart driver's camera, not isometric. Warm sunlight from upper left, dimensional soft painted shading with crisp readable leaf edges; match a lush playful high-quality mobile racing game illustration. Foliage must have natural irregular tips and dense lower coverage, not a straight rectangular hedge. No trees, no large trunks, no landscape, no horizon, no road, no rocks, no text, no border, no drop-shadow rectangle. Entire clump fits within frame with minimal transparent padding; base close to the bottom. Truly transparent alpha background. One isolated sprite only, landscape 2:1 composition; enough detail for clean scaling down.
```

</details>

## Object pooling

Repeating props/opponents are recycled:

```text
leave near zone
→ hide
→ reset metadata/depth/lateral position
→ return to far zone
→ reuse same Sprite
```

Do not destroy/create sprites continuously during the ticker.

Each pooled object tracks:

```js
{
  id,
  assetKey,
  category,
  depth,
  lateralRatio,
  zone,
  active,
  visualState
}
```

Current scenery uses a fixed population of 588 placements generated once by
`buildSceneryPlacements` from the thicket/canopy/tree/undergrowth/rock/verge
bands in `sceneryConfig`. Each placement has a stable id, asset reference, world
position, side, lateral ratio, scale and flip. Per side there are 44 rear
thickets, 32 canopy trees, 28 trees, 44 undergrowth props, 18 rocks and
128 verge plants. The single `SceneryLayer` reuses sprites and sorts their
ground depth in the shared world container alongside the finish gate.
It destroys only its own sprites and never the shared parent. It does not allocate new
sprites during movement or create a separate renderer per vegetation kind.
The same object continues from MID through NEAR and into its signed exit
tail. It returns to the far side of the loop only after its full silhouette
has left the viewport, instead of dissolving while still visible.

## Hover-kart direction

Vehicles do not need visible wheels.

**LOCKED (2026-08-19): the character/vehicle is ONE composite art asset.**
The monkey + helmet + scarf + tail + hover kart + propulsion housings are a
single transparent rear-view image placed as one sprite. Never assemble the
driver/vehicle from separate coded parts (head sprite + tail sprite + kart
body...), and never redraw the final art with Graphics/CSS — the current
Graphics kart is a placeholder that the real asset replaces wholesale.

Optional future idle animation (deferred 2026-08-23) = a few COMPLETE
aligned frame textures looped (same canvas size, same pivot, near-identical
silhouette; only the tail, scarf, hover glow and tiny body posture vary
between frames). Tail/scarf motion is baked into those frames, not rigged.
Today the player art is the static composite plus Pixi bob/tilt.

Separate Pixi overlays remain allowed on top of the composite sprite:
shadow, hover shockwave rings, trail, boost glow, mud splash, correct/wrong
pulses (C1-06). Container-level motion also stays code-side:

```text
idle       → subtle vertical bob
accelerate → small backward tilt
boost      → stronger tilt + trail
wrong      → short shake + mud splash
lateral    → slight side tilt
```

Server owns `vehicleTypeKey` and `vehicleColorKey`. Client maps keys to
whole-asset art (opponents follow the same composite concept later).

Vehicle frame processing (C1-06C): the 1254px master is center-cropped to
1046px and scaled to 768px WebP (`hoverKarts/hover-kart-<color>-idle-NN.webp`).
Every idle frame of a vehicle goes through the exact same box, never a
per-frame auto-trim — otherwise the shared anchor drifts between frames.

The 2026-09-07 trial increases `raceVisualConfig.playerKart.maxWidthRatio`
from 0.28 to 0.34 so the driver reads more clearly. Its screen-fixed center,
anchor and shared track geometry remain unchanged.

## Continuous world flow (C1-03M)

Authoritative `position` itself advances continuously on the server
(`elapsed time x speed x BASE_MOVEMENT_UNITS_PER_SECOND`); snapshots arrive
every ~2s and carry `snapshotAtEpochMs` + the server-owned
`movementUnitsPerSecond`.

```text
runtime player position  server-authoritative race progress — finish line,
                         future opponents, anything gameplay-relative
predictedPosition        renderer-internal DRAWING prediction: advances by
                         movementUnitsPerSecond between snapshots and
                         re-bases on new authoritative snapshots
visual position          drawing position advanced by one smoothed total
                         velocity: server rate plus bounded correction
```

One motion source: the road, ground and scenery scroll derive from the
visual position supplied by `studentRaceMotion`; no layer advances a
separate travel clock. `raceAnimationConfig.motion` owns correction limits,
response times and frame-step bounds. Base velocity follows the authoritative
movement rate over 400 ms. A separate correction velocity follows position
error over a 2800 ms horizon, smoothing changes over 700 ms. Their sum advances
the one visual position. Server-rate movement continues between snapshots.
For the first EASY-sized fixture (2→2.8 units/s and +10 position), the visual
peak is about 5.48 units/s, down from 7.41 before this refinement, and settles
to 2.8. A rapid synthetic +20 every 0.9 seconds remains continuous with a
bounded measured backlog of about 73 units; this is stress coverage, not a
normal-play performance claim. Once correction settles, genuine sustained server
speed remains: initial speed 0.5 is 2 units/s and maximum speed 2 is 8 units/s.
No server code or gameplay rules changed. `positionToPixelsRatio` 30 converts
server units into world pixels; apparent screen speed depends on perspective.
Drawing positions remain capped at `totalDistance`. The authoritative
`playerFinished` flag starts a bounded visual settle to the final position,
using the existing `raceAnimationConfig.effects.finishEffectDurationMs`
(1200 ms) as its sole duration owner. Neither reaching the distance nor
finishing that animation decides gameplay
completion. Prediction and correction never update server-owned runtime data.

## Finish gate

`FinishLineLayer` draws an upright gate with paired posts and a checkered
banner once using Pixi Graphics and `finishGateConfig`. Its position and
scale come from the same `projectTrackObject(totalDistance - visualPosition)`
as other track objects, retaining the default depth 0–1 visibility window.
The graphic uses projected depth as its `zIndex` in the shared world
container: farther foliage sits behind it and nearer foliage can occlude
it. The gate has no baked text and never decides completion; the server
finish flag remains authoritative.

## Opponents

S1-02 and server C2-01 supply authoritative `rank`, `playerCount` and the full
`opponents` roster (renamed from `nearbyPlayers`, 0..7 in standing order) in
runtime and answer snapshots. Rank/count are consumed by
the current HUD; C2-02/C2-03 locally implement opponent mapping and rendering,
pending review and live QA. `createRacePerspective` remains the only projection;
its inverse calibrates the player ground reference for opponents and the finish gate.
The shared vehicle visual reuses the existing asset loader and preserves player pixels.

Each opponent:

- is keyed by RacePlayer ID
- interpolates position from snapshots
- uses server lane/color/status
- has visual states `hidden → entering → visible → exiting`
- uses hysteresis to prevent flicker
- predicts at most 2.5 seconds from server timestamps, clamped to total distance
- uses full vehicle bounds for rear/side departure and pooled world-container roots
- never changes depth for visual convenience.

## Question panel

React/Mantine, never an image:

- question
- four answers
- visual timer
- loading/error/retry
- disabled/time-up/submitted
- correct/wrong feedback from server
- responsive safe-area layout.

The HUD shows authoritative rank/player count, score, streak, speed and
presentation-only progress. Missing or invalid server standing data is
hidden rather than calculated locally. The stopwatch styling displays the
existing question countdown as minutes:seconds, not elapsed race time.
`getStudentRaceHudModel`, `getStudentRaceTimerModel` and
`useStudentRaceQuestionTimer` own formatting and timer updates outside JSX.
`StudentRaceSpeedometer` accepts raw server speed only. Its pure
`getStudentRaceSpeedometerModel` produces multiplier text and the needle/arc
styles using `speed / (speed + 1)` as a cosmetic visual scale. This is not
a speed limit, percentage or km/h conversion; invalid/missing speed hides
the instrument, while zero is valid. The compact SVG has an accessible
i18n label and CSS transitions that respect reduced motion.

`StudentRaceReward` renders accepted correct-answer feedback above the
question area; the HUD combo chip reads the server streak. The existing
`useStudentRaceAnswer` owns question identity and the feedback dwell, and
`getStudentRaceHudModel` prepares the reward and signed server score delta.
`mapSubmitAnswerToModel` shares `assertValidRaceSnapshot` with runtime
application, so an invalid answer snapshot cannot expose a reward. The
submitted question is retained throughout feedback even if a background
refresh supplies the next question.
No reward is inferred from a tap, error, expiry or speed change. Accepted
question IDs deduplicate Pixi answer one-shots through
`resolveStudentRaceFeedbackEffect`/`detectRuntimeEffectTriggers`;
`EffectsLayer`, `drawFeedbackEffect` and `raceFeedbackVisualConfig` own
frame timing and bounded combo geometry. React owns localized reward text;
the server owns correctness, streak, points, speed and finish.

HUD surface, text, border and urgency colors derive from the existing theme
tokens. The selected light/dark/system preference controls the race UI through
the existing providers; there is no race-specific theme override.

## Dev preview

The local C1 development milestone is accepted for progression to C2.
Remaining browser/device QA is recorded separately in the client plan and
must pass before release; this acceptance does not mean those checks passed.

Dev-only routes and local runtime must be statically excluded from production builds.
Every production build verification searches the output for dev preview identifiers.

The local preview advances at `4 × speed` units per second. Open
`/dev/race?motionScenario=boost` starts at speed 0.5, applies one synthetic
+10 position/+0.2 speed sample after five seconds, then stays at speed 0.7
(2.8 units/s). This separates one position correction from sustained movement;
it no longer adds repeated bonuses at maximum speed. These fixtures exercise
camera correction and scenery movement only. `/dev/race?motionScenario=finish`
starts at position 900, giving about 21 seconds of approach at 4.8 units/s.
The explicitly labeled DEV preview has four clickable fixed fixtures:
correct, streak 3, streak 5 and wrong. Each uses a unique question ID,
the production answer mapper and the existing 900 ms feedback dwell.
Sample score/streak values exist only in this runtime harness; rank/count
are not invented. Production rank/count come from server snapshots and remain hidden when absent.
These fixtures are not copied server rules or
evidence of live answer integration. QA must cover multiple motion samples,
full-silhouette exits, narrow/wide/short frames and asset-loading failures
as part of the recorded local checks and remaining pre-release QA.

Validation rerun (2026-09-08): 402 client tests in
49 files, ESLint and the production build pass. The known main-chunk warning
remains (899.70 kB; race chunk 271.17 kB). Built JavaScript contains no
local-runtime, preview, motion-scenario or DEV-race identifiers. DEV browser checks at widths
320, 375, 412, 768, 1024 (short frame) and 1280 found no horizontal overflow
and all four answers fit. Preview controls exercised combo/Pixi feedback
without inventing missing rank. Light English/LTR and system-dark Hebrew/RTL
were inspected on 2026-09-07. Reduced motion has unit/CSS and actual-Mantine-hook
component integration coverage; browser verification
remains open. Existing projection tests cover reciprocal round-trips, optical
flow, zone continuity, texture/prop agreement, signed foliage exits and phase
wrapping. Earlier world checks covered gate/foliage depth and theme switching.
The accepted world remains the design baseline. Live API checks on 2026-09-07
verified two-player create/join/start, correct/wrong answers, reconnect with
persistent speed and normal finishes retaining score/streak/rank. Real browser
checks verified join/wait/start, correct/combo feedback and speed changes,
actual expiry/question reset and near-finish reload into FINISHED. Current
browser offline/hidden→visible recovery, reduced-motion emulation and
physical-phone QA remain open. DEV browser checks are not a phone-performance
benchmark. Follow the carried-forward pre-release checklist in
`CLIENT_IMPLEMENTATION_PLAN.md`. C1 local development is closed for progression
to C2; C2-02/C2-03 are locally implemented. C2-04 finish choreography remains pending.

## Race audio — planned C2-A

Add sound immediately after the first integrated opponent renderer. The
implementation and acceptance owner is C2-A in `CLIENT_IMPLEMENTATION_PLAN.md`.
This checkpoint adds no playable audio or sound assets.

Use focused audio manifest metadata for engine/ambient loops and short
correct/wrong/combo/boost/finish cues. One feature audio controller consumes
the existing accepted-answer identity and authoritative runtime transitions;
React renders mute/volume controls, while Pixi continues to own graphics.
Do not trigger sounds from unconfirmed clicks or infer gameplay events.
Avoid duplicate effects on polls/reconnect, pause loops while gameplay is
unavailable, release playback on unmount and retain a usable silent fallback.
Sound must reinforce the visible feedback and remain optional for classroom use.
