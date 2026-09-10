import hoverKartGreenIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-green-idle-01.webp";

/*
 * Client-owned art per server vehicleAssetKey (runtime.player.vehicleAssetKey).
 * The key is opaque server data — this manifest is the ONLY place it becomes
 * client art; never build file paths from the key itself.
 *
 * Entry contract:
 *   {
 *     idleFrames: [assetUrl, ...],  // Vite-imported URLs, looped in order —
 *                                   // 1 static frame (C1-06C) or the full
 *                                   // aligned idle set (C1-06D)
 *     anchorX: number,              // sprite anchor (0..1)
 *     anchorY: number,
 *     baseScale: number,            // relative to the layout kart width
 *   }
 */
// Frames are the 1254px master center-cropped to 1046px and scaled to
// 768px — every later idle frame must use the exact same box (alignment).
const GREEN_MASTER = Object.freeze({
  idleFrames: [hoverKartGreenIdle01],
  anchorX: 0.5,
  anchorY: 0.96,
  baseScale: 1.08, // art spans 92% of its canvas → fills the layout box
});

export const STUDENT_RACE_VEHICLE_MANIFEST = Object.freeze({
  TOY_CAR_GREEN: GREEN_MASTER,
  // Interim (2026-09-05): every server lane color renders the GREEN master
  // until per-color art lands — swap the definitions, never the keys.
  TOY_CAR_PURPLE: GREEN_MASTER,
  TOY_CAR_RED: GREEN_MASTER,
  TOY_CAR_BLUE: GREEN_MASTER,
  TOY_CAR_ORANGE: GREEN_MASTER,
  TOY_CAR_PINK: GREEN_MASTER,
  TOY_CAR_YELLOW: GREEN_MASTER,
  TOY_CAR_CYAN: GREEN_MASTER,
});
