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
export const STUDENT_RACE_VEHICLE_MANIFEST = Object.freeze({
  // Empty until the first approved GREEN MASTER lands (C1-06C).
});
