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
  playerKart: Object.freeze({
    screenXRatio: 0.5, // horizontal center of the frame
    screenYRatio: 0.76, // near the bottom, leaving room for the question panel
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
    horizonYRatio: 0.34, // vanishing-point height (matches the reference art)
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
    depthMarkerCount: 5,
    curbSegmentCount: 14,
  }),
});
