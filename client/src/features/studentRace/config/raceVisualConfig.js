/*
 * Screen geometry + layer composition for the student race screen — where
 * things sit and how big they are. Never game rules, and never unit
 * conversions (those live in raceAnimationConfig.js).
 */
export const STUDENT_RACE_VISUAL_CONFIG = Object.freeze({
  // The centered game frame on tablet/desktop; phones play fullscreen.
  // (Owner moved here from studentRaceConfig in UI-10C.)
  gameFrame: Object.freeze({
    maxWidth: 520,
    minHeight: 640,
  }),

  // The kart is (almost) fixed on screen; the world moves toward it.
  // Vertical placement lives in layout.world.playerKartAnchorYRatio (G) —
  // a ratio of the VISIBLE world area above the question panel, never of
  // the raw screen.
  playerKart: Object.freeze({
    screenXRatio: 0.5, // horizontal center of the frame
    maxWidthRatio: 0.34, // kart width relative to frame width
  }),

  // Parallax speed of each world layer relative to the road (road = 1).
  // In the over-the-shoulder camera these scale DEPTH flow (toward the
  // viewer), not sideways scrolling.
  layers: Object.freeze({
    jungleFarSpeedMultiplier: 0.15,
    jungleMidSpeedMultiplier: 0.35,
    foregroundLeavesSpeedMultiplier: 0.65,
    roadSpeedMultiplier: 1,
  }),

  // Pseudo-perspective camera (the binding F decision: over-the-shoulder
  // view like the reference art, NOT a flat scrolling texture). Shared by
  // every world layer — the horizon must be ONE value, so it lives here.
  camera: Object.freeze({
    // Ratio of the VISIBLE world area above the question panel (G) — the
    // whole composition (horizon, zones, kart) lives in the visible strip.
    horizonYRatio: 0.34,
    vanishingPointXRatio: 0.5,
    roadTopWidthRatio: 0.18, // road width where it meets the horizon
    // Track-model decision (F-1): the near road is WIDER than the screen —
    // it bleeds off both edges next to the player (a full 8-lane track
    // can't fit the frame up close); road edges + jungle read from
    // mid-depth toward the horizon.
    roadBottomWidthRatio: 1.35,
  }),

  // Placeholder road drawing density (visual detail, never game rules).
  road: Object.freeze({
    curbSegmentCount: 14,
    mudDetailCount: 15,
  }),

  // The view window split (track model, LIVE since F-2): depth 0 = horizon,
  // 1 = the player. Live consumers today: RoadLayer (curb/edge fade, mud
  // detail). Future consumers: opponent visibility caps per zone
  // (maxOpponents / maxLaneDeltaVisible — documented in the master plan,
  // added here when opponents land).
  viewDepthZones: Object.freeze({
    far: Object.freeze({ minDepth: 0, maxDepth: 0.35 }),
    mid: Object.freeze({ minDepth: 0.35, maxDepth: 0.7 }),
    near: Object.freeze({ minDepth: 0.7, maxDepth: 1 }),
  }),

  // Screen layout contract (G): the Pixi canvas is FULL-SCREEN; the React
  // question panel overlays its bottom; the whole world composition is
  // computed against the VISIBLE area above the panel.
  // resolveStudentRaceLayoutMetrics is the ONE numeric implementation the
  // Pixi side consumes; the DOM panel mirrors the same clamp in CSS from
  // these same values — one config, two renderers of it.
  layout: Object.freeze({
    questionPanel: Object.freeze({
      heightRatio: 0.36, // of the screen height
      minHeight: 300,
      maxHeight: 380,
      sideInset: 12,
      // World pixels peeking behind the panel's rounded top corners.
      topOverlap: 18,
    }),
    hud: Object.freeze({
      topInset: 12,
      sideInset: 12,
      minHeight: 72, // reserved strip for the future UI-10K chips
    }),
    world: Object.freeze({
      // Kart anchor as a ratio of the visible world height above the panel
      // (lands inside the near zone, like the reference art).
      playerKartAnchorYRatio: 0.82,
    }),
  }),
});
