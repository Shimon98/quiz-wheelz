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
C1-03M continuous authoritative movement, C1-04 HUD, C1-05 presence/reconnect.

Next:

```text
C1-06 assets/polish
C2    opponents
```

The old “H is blocked” note is stale because the server race-state endpoint is now
merged.

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

- road wider than viewport; edges are not visible
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

All track objects use one projection owner:

```js
perspective.projectTrackObject(relativeDistance)
```

Future lateral extension:

```js
perspective.projectTrackObject(relativeDistance, laneDelta)
```

Result includes at least:

```js
{
  visible,
  depth,
  y,
  roadHalfWidth,
  x,
  scale
}
```

Do not implement independent math inside each layer.

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
  parallaxMultiplier: 0.7,
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

Suggested target:

```text
assets/game/studentRace/
  backgrounds/
  road/
  hoverKarts/
  effects/
  finish/
  props/
  overlay/
```

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

## Hover-kart direction

Vehicles do not need visible wheels.

**LOCKED (2026-08-19): the character/vehicle is ONE composite art asset.**
The monkey + helmet + scarf + tail + hover kart + propulsion housings are a
single transparent rear-view image placed as one sprite. Never assemble the
driver/vehicle from separate coded parts (head sprite + tail sprite + kart
body...), and never redraw the final art with Graphics/CSS — the current
Graphics kart is a placeholder that the real asset replaces wholesale.

Future idle animation (C1-06) = 3–4 COMPLETE aligned frame textures looped
(same canvas size, same pivot, near-identical silhouette; only the tail,
scarf, hover glow and tiny body posture vary between frames). Tail/scarf
motion is baked into those frames, not rigged.

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

## Continuous world flow (C1-03M)

Authoritative `position` itself advances continuously on the server
(`elapsed time x speed x BASE_MOVEMENT_UNITS_PER_SECOND`); snapshots arrive
every ~2s and carry `snapshotAtEpochMs` + the server-owned
`movementUnitsPerSecond`.

```text
position                 server-authoritative race progress — finish line,
                         future opponents, anything gameplay-relative
predictedTargetPosition  renderer-internal DRAWING prediction: advances by
                         movementUnitsPerSecond between snapshots, re-based
                         by every new authoritative snapshot, capped at
                         totalDistance (the FINISHED transition is server
                         truth alone)
```

One motion source: the road/jungle scroll derives from the smoothed
predicted position (the earlier separate cosmetic travel offset was retired
— it would count movement twice). The world flows the whole time the server
rate is above zero (race start grants `MIN_RACING_SPEED` + the movement
anchor), accelerates/decelerates with answer results and timeouts, and
stops only because the FINISHED rate is 0 — the renderer has no status
logic, and prediction never becomes gameplay truth.

## Opponents

Requires server `nearbyPlayers` and authoritative rank.

Each opponent:

- is keyed by RacePlayer ID
- interpolates position from snapshots
- uses server lane/color/status
- has visual states `hidden → entering → visible → exiting`
- uses hysteresis to prevent flicker
- is capped by zone and lateral visibility
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

## Dev preview

Dev-only routes and local runtime must be statically excluded from production builds.
Every production build verification searches the output for dev preview identifiers.
