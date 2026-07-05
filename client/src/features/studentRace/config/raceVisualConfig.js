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
  layers: Object.freeze({
    jungleFarSpeedMultiplier: 0.15,
    jungleMidSpeedMultiplier: 0.35,
    foregroundLeavesSpeedMultiplier: 0.65,
    roadSpeedMultiplier: 1,
  }),
});
