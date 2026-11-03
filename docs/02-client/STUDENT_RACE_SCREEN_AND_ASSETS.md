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
C1-06E server-driven correct/wrong/finish Pixi feedback (the boost drawer waits for an
authoritative boost cue).

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
below used lossless WebP encodings of their private generated PNGs; since
2026-10-19 both runtime files are quality-85 lossy WebP with byte-identical alpha.
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
The runtime WebP is 1254×1254 pixels. It was first encoded losslessly from
the generated PNG (2,136,844 bytes, every decoded RGBA byte verified as
identical); since 2026-10-19 it is quality-85 lossy WebP (633,756 bytes) with
byte-identical alpha, chosen after an in-game comparison. No resizing,
recoloring or artwork edits were applied. The 2,835,611-byte source PNG stays private at
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
Its RGBA WebP is 1774×887 pixels: first lossless (1,344,364 bytes, decoded
pixels verified identical to the generated source), since 2026-10-19
quality-85 lossy (360,908 bytes) with byte-identical alpha. No crop, resize or
color edit was applied. The private source is
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
1046px and scaled to 768px WebP (`hoverKarts/hover-kart-<color>-idle-NN.webp`),
q90 lossy with lossless alpha for every colour (the seven recoloured frames
were re-encoded from lossless on 2026-10-18: about 88 KB each).
Every idle frame of a vehicle goes through the exact same box, never a
per-frame auto-trim — otherwise the shared anchor drifts between frames.

The 2026-09-07 trial increases `raceVisualConfig.playerKart.maxWidthRatio`
from 0.28 to 0.34 so the driver reads more clearly. Its screen-fixed center,
anchor and shared track geometry remain unchanged.

## Gameplay mode presentation (C5-03 groundwork)

Server gameplay modes are presented, never decided, by the client:

```text
runtime.gameplay.mode / question.gameplayContext
→ RACE_GAMEPLAY_PRESENTATION (one table: icon, i18n keys, kart aura)
→ React badge + panel accent (CSS tokens by data-gameplay)
→ Pixi player aura
```

- The bottom panel geometry has one owner, `StudentRacePanelSurface`; the
  question and the Challenge choice (C5-02) render inside it. A mode accent
  is a 4 px inset shadow, so the NORMAL panel keeps its exact geometry and
  the Pixi kart anchor (`resolveStudentRaceLayoutMetrics`) stays correct.
- Normal, Turbo and Safe questions share one question component; only the
  badge in the stable status line and the accent change.
- The player kart gets one ground aura between its shadow and the kart body,
  drawn once and recolored by tint with additive blending, so it reads as a
  glow on the orange road. It is a permitted overlay on the composite art,
  not a redraw of the art. Turbo now uses a restrained steady alpha of 0.12;
  Safe stays steady at alpha 0.18. Both mode auras fade in/out over 320 ms with the pose
  and settle immediately under reduced motion. Opponents get nothing until the server exposes
  their mode.
- Thrusters (C5-03, local): a player-only glow drawn on the art's own rear
  nozzles — centres and radius measured in the 768 px art and recorded in
  the vehicle manifest (`thrusters`, `thrusterRadius`, identical on every
  color). Turbo question entry keeps the original blue nozzles and idle pose. Only a fresh
  accepted `TURBO_SUCCESS` moment uses the painted transparent exhaust, aimed toward the
  camera with subtle length modulation; Safe keeps a calm blue light. A small tapered
  code flame is the asset-failure fallback.
  It is an overlay, not a redraw of the art.
- Safe results (C5-03l): a shallow thin blue ground ellipse, no stars or large driver-height
  rings. Nozzle acknowledgement stays inside its housing, with no halo, gold rays or fire.
  Safe Complete uses a shorter, quieter pulse than Safe Perfect; both ease in and out.
- Monkey poses (C5-03, local): `hover-kart-<color>-safe-01.webp` (lounging,
  banana can) and `-turbo-01.webp` (leaning forward), one per colour. Each is
  the shipped idle image with only the zone above the cockpit rim replaced by
  the aligned candidate monkey; the kart body below the rim is unchanged
  (0 visible pixels), so the anchor, size and nozzle centres match the idle
  frame. Player only, preloaded shortly after the kart art appears and
  transitioned over 320 ms without changing kart scale (Turbo return: 160 ms, C5-03m).
  The blend filter inherits renderer resolution and antialiasing to preserve native sharpness.
  Weighted images are summed on an
  isolated Pixi surface during the blend, then composited normally so the shared kart body
  remains opaque. Reversing a transition preserves the current blend. Safe follows its
  server mode; Turbo launch follows a fresh accepted success moment for 1.3 s. No driver/body
  splitting or articulated rig is introduced. These remain two-pose dissolves, not newly
  authored intermediate animation frames.
- Challenge slowdown (C5-03m): active server `SPEED_SLOW` with source `CHALLENGE_TIMEOUT`
  or `TURBO_FAILURE` dims the nozzle overlays and shows an amber speedometer label and
  compact notice. This is presentation of the existing penalty, never a local speed/timer rule.
- Exhaust art: `assets/game/studentRace/effects/turbo-exhaust-painted.webp`, 192 x 288,
  11,968 bytes, transparent alpha; imported only by `studentRaceEffectManifest`. Generated
  with built-in imagegen on 2026-10-18 from an original downward painted jet-flame prompt,
  then resized and WebP-encoded; no third-party source image. No metal, text or nozzle is
  baked into this overlay. One texture is shared by both nozzles and all eight kart colors.
- Turbo success has restrained side speed lines and nozzle fire, without star particles
  or a filled ground disc. No camera push or special motion acceleration is applied; the
  server progress reward uses normal interpolation and live speed remains server-owned.

### Challenge choice art (C5-02, committed locally)

- Three WebPs in `client/src/assets/game/challenge/`: `turbo-emblem.webp`,
  `safe-emblem.webp` (choice cards) and `challenge-energy.webp` (HUD meter).
  One manifest owns them: `features/studentRace/config/raceChallengeArt.js`
  (`RACE_CHALLENGE_ART`); the presentation table and the HUD read it, no
  component imports the files directly. Masters and the recolor script stay
  in the private `docs/vision/` folder.
- Card art is `clamp(56px, 22vw, 112px)`, 48 px when the viewport is at most
  620 px tall (phone landscape); title and description stay text (i18n).
- The energy meter sits in the HUD progress column under the track bar:
  crystal art, a violet bar clamped to the server threshold, and a visible
  `75/100` value (tabular digits, `dir="ltr"`). Checked at 320, 390, 430 px
  and 844×390 without overflow.

### Luck and Guard Shield presentation and art slots (C5-04f F1–F2, 2026-10-29 – 2026-11-02)

Approved direction (Shimon, 2026-10-29, from Astra's V2 concepts in the private
`docs/vision/c5_04f_astra_v2_2026-10-29/`): shield A (soft glass), wind A (soft
ribbons), orb A, blocked B (a clear hit on the shield's edge, mud thrown back out) and
a crown splash for the mud. Refined 2026-10-30 (the mud: Shimon's pick, the wide, low
painted splash of concept A) and 2026-11-01 (Astra's V3, in the private
`docs/vision/c5_04f_astra_v3_2026-10-31/`, approved for the orb, the wind and the
blocked hit, and on 2026-11-02 for the mud too, after a live race showed the drawn
puddle; the standing shield stays as it was). Each effect is Pixi
`Graphics` plus one painted part. V3's review measures its effects in kart widths (the
108-unit art frame, `kart.artWidth`); the bursts below use its numbers.

**Geometry.** Every Luck effect is laid out in kart-local units (`studentRaceVehicleGeometry.js`)
and placed with `playerKartFrame(layout, vehicleVisualScale)` + `kartLocalToScreen`: the
same ground point, pivot and scale the kart's root gets (the 2.5-unit bob aside), so an
effect fits the kart as drawn on every screen. The helmet top is measured in the art
(`headTop` in the vehicle manifest: row 30 of the 768 px idle pose; Safe peaks at 39,
Turbo at 125; every color matches). The bubble is one constant, `KART_SHIELD_BUBBLE`,
shared by the standing shield and the blocked hit. Before this, the orb used the nominal
`maxWidth`, so it started on the helmet on tablets and short phones (360×640).

| Effect | Owner | Beats (ms) | Drawn | Art slot (replaces) |
|---|---|---|---|---|
| Guard Shield (standing) | `KartLuckMarks` | fades in over 240, leaves at once | glass behind the art; rim, reflection, glints, foot ring in front | none (`shieldGlint` has no owner) |
| Tailwind burst | `drawLuckEffect` | the right side 24 behind the left; both climb and fade by 450 | two three-band ribbons a side, from the ground beside the kart, bulging out as they climb past the helmet, clear of the art | `windLeaf`: one leaf a side riding the main ribbon |
| Energy Orb | `drawLuckEffect` | 0–80 ignite, 80–220 full, 220–550 rise and fade; a light pulse 40–270, two motes from 90 | a stand-in orb the same size, the ignition glow, the pulse, the motes (no ring) | `energyOrb`: the whole orb, 0.43 kart widths, 0.075 above the helmet |
| Mud burst | `drawLuckEffect` | 0–75 two blobs fly in and land under the kart; 75–450 four drops thrown out from beside it in arcs, fading from 180 | painted-look blobs (body, middle, highlight) | `mudDrop`: every blob and drop, head first along its path; the puddle is `KartLuckMarks`' own |
| Mud puddle | `KartLuckMarks` | on a Mud moment it bursts up as the blobs land (75, from 70% of its size), is full by 150, settles 180–450 to 56% of its height and keeps that for the server's window, then fades out over 300; a window without a moment (a refresh) or reduced motion shows it settled at once | a drawn puddle until the file loads, or if it fails | `mudSplash`: the whole puddle, behind the kart |
| Shield blocked | `drawLuckEffect` | 0–90 mud closes in; flash up by 115, held to 145, gone by 260; lit edge fades 160–390; spray out to 550 | blobs, lit edge (±0.48 rad), two flattened ripples, spray | `shieldImpact`: the flare, its point of contact on the edge, turned inward; `mudDrop`: the blobs and the spray |

The hit always lands on the bubble's left edge, a little above its middle: the server
names no side. The mud puddle and the wind wisps stay with `KartLuckMarks` for the
server's window. The puddle lies behind the kart, so the kart sits in it and nothing
covers the kart; no dust rises from the kart while a Mud window is open.

The effect manifest (`pixi/assets/studentRaceEffectManifest.js`, `LUCK_EFFECT_ART`)
holds one slot per planned file; a slot whose file does not exist yet has `url: null`
(today only `shieldGlint`). A slot gets a static import only once its file exists, so
the build never depends on a missing file. The V3 files are exported whole from Astra's
1254 px paintings by the private `docs/vision/c5_04f_2026-10-28/v3-source/process_v3_art.py`
(Pillow, premultiplied resize, WebP q90 with full-quality alpha), so positions measured
in a painting stay true. The mud crown fills only a band of its square, so it is cropped
to its paint first and the script measures V3's ground point in the crop. The six Luck
files weigh 75 KB together.

| Slot | File (`assets/game/studentRace/effects/`) | Size and fit (export spec) |
|---|---|---|
| `energyOrb` | `luck-energy-orb.webp` | **connected 2026-11-01** (V3): 256×256, 21 KB; the painted orb fills `cover` 0.844 of its square (measured); drawn whole, 0.43 kart widths, growing from 45% as it ignites |
| `windLeaf` | `luck-wind-leaf.webp` | **connected 2026-11-01** (V3): 192×192, 7.4 KB; drawn 0.2 kart widths, turned by −1.1 rad plus 0.25 per side and 0.4 along the climb (the painted leaf leans) |
| `mudSplash` | `luck-mud-splash.webp` | **connected 2026-11-02** (V3, replacing the 2026-10-30 cut of V2 concept A): Astra's mud crown cropped to its paint, 512×183, 24.9 KB; `KartLuckMarks` lays it behind the kart, 183 units across (V3: 1.76 kart widths for the whole square), with V3's ground point (0.5, 0.77 of the square, `anchorX`/`anchorY` 0.492, 0.927 of the file) 8.6 units under the kart's ground line |
| `mudDrop` | `luck-mud-drop.webp` | **connected 2026-11-03** (Shimon: the mud that flies to the side should be painted too): one glossy teardrop cut alone from Astra's V2 concept B mud sheet by the private `docs/vision/c5_04f_2026-10-28/mud-source/process_mud_drop.py`, turned so its head points right (+x) and its highlight up; 96×60, 3.4 KB. Drawn as thick as the drawn blob it replaces and as long as the painting, turned along its heading; a drop heading left is mirrored, never turned over. Used by the Mud burst, the blocked hit and the wrong answer's splash (`drawWrong`); without it the drawn blobs stay |
| `shieldImpact` | `luck-shield-impact.webp` | **connected 2026-11-01** (V3): 256×256, 16.2 KB; its white-hot point of contact at `anchorX`/`anchorY` (0.43, 0.52) sits on the shield's edge; drawn 0.48 kart widths, turned to face into the bubble |
| `windWisp` | `luck-wind-wisp.webp` | **connected 2026-11-03** (Astra V4): an upright cyan-white wisp, 25×160, 2.5 KB; `KartLuckMarks` blows one for each of the six streaks of an open Tailwind window, 36 units long, leaning 0.17 rad out from the kart, at 0.85 of the streak's strength; still under reduced motion. Without it the drawn streaks stay |
| `shieldGlint` | `luck-shield-glint.webp` | no owner: the standing shield paints its own reflection (V3's reflection painting was not taken, 2026-11-01); give it one (a loader in `KartLuckMarks`) only if a delivered glint beats it |

The kart art is 108 units wide on a 100-unit frame; transparent margins, no text,
frame or background; one file serves all eight kart colors.

Loading contract (`EffectsLayer` for the bursts, `KartLuckMarks.loadArt` for the puddle and the
wind wisp, `FinishLineLayer.loadArt` for the gate; the `KartThrusters.loadArt` pattern):
- A slot without a url asks for nothing and the Graphics drawing stays.
- A slot with a url loads once, beside the world: the renderer's readiness never
  waits for decorative art. The renderer's own `prepareTexture` pins it in GPU
  memory, like the Turbo and Safe art, so a rare event never uploads at its moment.
- A failed load, or one that finishes after the race screen is gone, is dropped
  quietly and the Graphics drawing stays; the other slots are unaffected.
- `Graphics.texture` takes its alpha from the fill style, which every fill leaves
  behind, so each art draws inside a saved state at its own alpha and each burst hands
  the brush back as it found it. The context's rotate also turns any translate already
  made, so turned art (the leaves) rotates first and moves second.
- Reduced motion plays no burst, with or without art; the mud puddle still lies there for
  its window, settled at once. The finish still outranks Luck.
- The race screen keeps no Luck art of its own: teardown destroys children, never
  textures, so `Assets` keeps a loaded file for the next race (checked over 20 re-entries
  and a WebGL context loss in DEV on 2026-10-29, and again with the four real files on
  2026-11-01: every mount drew the same texture objects, none destroyed, two WebGL
  contexts alive at a time).

Adding an approved file: copy it to the path above, give its slot a static import and
`url`, and adjust `cover` or the puddle and flare anchors only from what is measured in
the file. Nothing else changes.

### Astra V4 art (connected 2026-11-03)

Astra's V4 round (private `docs/vision/astra_v4_2026-11-03/`: 14 paintings, before/after
reviews on DEV screenshots) replaced the drawn effects that still looked plain. Shimon left
the pick to the client ("use what is good"): 13 paintings are connected, the Turbo speed
lines stay drawn (faint on purpose behind the flame burst, and Astra's comet-headed streak
would lead the wrong way down the road). Lights stay drawn on purpose too: the thruster
glow, the challenge aura, the shield's lit edge, the orb's pulse. Each painting is cropped
to its paint and resized by the private
`docs/vision/c5_04f_2026-10-28/v4-source/process_v4_art.py`; the 13 files weigh 162 KB, the
gate 69 KB of it. They are slots of `STUDENT_RACE_EFFECT_ART` (the wisp is the Luck slot
`windWisp` above) and follow the loading contract above: drawn until the file loads, drawn
again if it fails, pinned by the renderer's `prepareTexture`, never waited for.

| Slot | File | Owner | Fit |
|---|---|---|---|
| `burstRing` | `burst-ring.webp` (384) | `drawFeedbackEffect`, `drawChallengeResultEffect` | one white ring, tinted per use, its middle line (`radius` 0.883 of its half-width, measured) on the drawn ring's radius: the correct answer's green and gold rings and the finish's gold and white ones at 0.65 of the stroke's alpha, the Safe ripple flat on the road in sky at 1.4 of its thin stroke's alpha |
| `sparkle` | `answer-sparkle.webp` (85×96) | `drawFeedbackEffect` | the correct answer's eight sparkles, upright, as wide as the drawn star |
| `groundImpact` | `wrong-ground-impact.webp` (512×103) | `drawFeedbackEffect` | the wrong answer's dry dirt in the drawn orange ring's box (0.66–1.4 × 0.22–0.46 of the nominal kart width), on the road behind the kart; the painted mud drops still fly in front. Light dry dirt, not the dark wet Mud |
| `dustPuff1`–`3` | `dust-puff-1…3.webp` (128) | `EffectsLayer` | each puff takes the next of the three in turn; born 0.025 of the screen wide, growing threefold, from 0.64 alpha fading out, turning 0.18 rad away from the kart |
| `confettiRect`, `confettiRibbon`, `confettiStar`, `confettiDot` | `confetti-*.webp` (96) | `drawFeedbackEffect` | the finish's 14 pieces in their drawn colours (gold, white, green, sky), 0.08–0.12 of the nominal kart width, each spinning 2.3 rad over the burst from its own turn |
| `smokePuff` | `turbo-smoke-puff.webp` (160×118) | `drawChallengeResultEffect` | the Turbo failure's eight puffs, as wide as the drawn ones, behind the kart, turning 0.3 rad away from it as they rise |
| `finishGate` | `finish-gate.webp` (1024×512) | `FinishLineLayer` | the whole gate, anchored on the road between its feet (`anchorX`/`anchorY` 0.499, 0.987), scaled so its feet (`feetApart` 0.883 of its width) stand where the drawn posts do; about 10% taller than the drawn gate |

**Behind the kart.** The dust, the wrong answer's dirt and the Turbo failure's smoke lie on
the road: `EffectsLayer` keeps their `Graphics` in the world container (the renderer passes
it as `groundContainer`) at `zIndex` just under `playerDepth`, so the kart covers them and
they cover the road and everything farther away. The rest of the bursts stay in the effects
container, above the world.

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

The visual speed (`visual.targetSpeed`, the server's effective speed since C5-01) only drives
the kart's bob and the dust; it never moves the world.

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
banner once using Pixi Graphics and `finishGateConfig`; since 2026-11-03
Astra's painted gate (`finishGate`, see Astra V4 art) takes its place once
it loads, its feet where the drawn posts stand, and the drawing stays as
the fallback. Both live in one `gate` container. Its position and
scale come from the same `projectTrackObject(totalDistance - visualPosition)`
as other track objects, retaining the default depth 0–1 visibility window.
The gate uses projected depth as its `zIndex` in the shared world
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
- shares one normalized motion authority with the local kart: checkpoint age from
  server timestamps, one 5-second prediction limit for both, seeding at the
  checkpoint-aged position, and duplicate checkpoints that never renew the horizon
- sits in the shared sorted world container with the local kart, whose `zIndex` is
  its own ground depth, so nearer opponents occlude it and farther ones are occluded
- keeps its server lane as one full step (kart width plus a 20% gap) and is drawn only
  where that lane fits: near and mid opponents whose lane step exceeds the zone side
  clearance (screen edge beside the driver, 85% of the road half-width farther ahead)
  stay hidden instead of stacking, so phones show one neighbour per side near and two
  per side mid; far opponents beyond the last fitting lane compress monotonically
- scales with the driver so one kart plus its gap fits beside the driver on phones
  (`playerKart.maxParallelWidthRatio`, 0.23 of the frame width)
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
`StudentRaceSpeedometer` accepts server speed only: since C5-01 the HUD passes
`visual.targetSpeed`, the server's effective speed (the base speed only when none was sent). Its pure
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
`resolveStudentRaceFeedbackEffect`/`deriveStudentRaceMoments`;
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
to C2; C2-02/C2-03/C2-04 are locally implemented, pending review and live QA.
Crossing requires confirmed finish-prefix release; same-ms cohorts release together.
Own/opponent runout uses one interpolation with a shared crossing midpoint, so visual
backlog cannot reverse server order. Passive finish reads do not revive gameplay presence.

## Race audio — C5-A

Race audio is integrated (C5-A in `CLIENT_IMPLEMENTATION_PLAN.md`). The race screen
claims the race music, preloads its short sounds and runs the hover-engine loop while
gameplay is ready and the player races, with the playback rate following the presented speed
(`visual.targetSpeed`, the server's effective speed).
`useStudentRaceMoments` hands one batch to both the renderer and `studentRaceSounds`:
correct, combo tiers from the server streak, wrong, time up (never over answer feedback or a
submit in flight) and finish, each once. A batch that arrives while Pixi is still starting waits
in `PixiStudentRaceCanvas` and is drawn once the renderer exists. BOOST has no sound until an
authoritative boost cue exists.
Do not trigger sounds from unconfirmed clicks or infer gameplay events.
Avoid duplicate effects on polls/reconnect, pause loops while gameplay is
unavailable, release playback on unmount and retain a usable silent fallback.
Sound must reinforce the visible feedback and remain optional for classroom use.
