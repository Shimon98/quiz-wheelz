/*
 * Stable identifiers for every visual asset of the student race screen.
 * Renderer layers and the asset manifest speak ONLY in these keys — never in
 * file names — so swapping art (placeholder -> final, v1 -> v2) never touches
 * renderer code.
 */
export const STUDENT_RACE_ASSET_KEYS = Object.freeze({
  JUNGLE_BACKGROUND_FAR: "jungleBackgroundFar",
  JUNGLE_BACKGROUND_MID: "jungleBackgroundMid",
  JUNGLE_FOREGROUND_LEAVES: "jungleForegroundLeaves",

  ROAD_LOOP: "roadLoop",
  ROAD_SIDE_DIRT: "roadSideDirt",

  PLAYER_KART: "playerKart",

  DUST_EFFECT: "dustEffect",
  CORRECT_EFFECT: "correctEffect",
  WRONG_EFFECT: "wrongEffect",

  FINISH_LINE: "finishLine",
  SMALL_TRACK_PROP: "smallTrackProp",
});
