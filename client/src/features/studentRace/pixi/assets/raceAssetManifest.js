import { STUDENT_RACE_ASSET_KEYS as KEYS } from "./studentRaceAssetKeys";

/*
 * The loading contract for the student race screen's art: what each key
 * means, where its file is expected to live, and what the renderer does
 * while the real art doesn't exist yet. Documentation + contract ONLY —
 * actual imports/loading happen in the Pixi shell (UI-10D), which reads THIS
 * manifest and never hardcodes paths.
 *
 * required: true            -> v1 renders this element even as a placeholder.
 * fallback: GRAPHICS        -> renderer draws simple shapes until the file
 *                              exists (Diana-approved placeholder strategy).
 * fallback: NONE            -> element is simply skipped while missing.
 */
export const ASSET_PLACEHOLDER = Object.freeze({
  GRAPHICS: "graphics",
  NONE: "none",
});

export const STUDENT_RACE_ASSET_MANIFEST = Object.freeze({
  [KEYS.JUNGLE_BACKGROUND_FAR]: Object.freeze({
    key: KEYS.JUNGLE_BACKGROUND_FAR,
    description: "Farthest parallax jungle layer (slowest movement).",
    expectedPath:
      "client/src/assets/game/studentRace/backgrounds/jungle-background-far.webp",
    required: true,
    fallback: ASSET_PLACEHOLDER.GRAPHICS,
  }),

  [KEYS.JUNGLE_BACKGROUND_MID]: Object.freeze({
    key: KEYS.JUNGLE_BACKGROUND_MID,
    description: "Middle parallax jungle layer.",
    expectedPath:
      "client/src/assets/game/studentRace/backgrounds/jungle-background-mid.webp",
    required: true,
    fallback: ASSET_PLACEHOLDER.GRAPHICS,
  }),

  [KEYS.JUNGLE_FOREGROUND_LEAVES]: Object.freeze({
    key: KEYS.JUNGLE_FOREGROUND_LEAVES,
    description: "Foreground leaves passing fastest, in front of the road.",
    expectedPath:
      "client/src/assets/game/studentRace/backgrounds/jungle-foreground-leaves.webp",
    required: false,
    fallback: ASSET_PLACEHOLDER.NONE,
  }),

  [KEYS.ROAD_LOOP]: Object.freeze({
    key: KEYS.ROAD_LOOP,
    description:
      "Jungle road surface for the pseudo-perspective (over-the-shoulder) " +
      "camera — art must read correctly as a trapezoid converging to the " +
      "horizon, NOT as a flat vertically-scrolling texture (F camera decision).",
    expectedPath: "client/src/assets/game/studentRace/road/road-loop.webp",
    required: true,
    fallback: ASSET_PLACEHOLDER.GRAPHICS,
  }),

  [KEYS.ROAD_SIDE_DIRT]: Object.freeze({
    key: KEYS.ROAD_SIDE_DIRT,
    description: "Dirt/grass strip along the road edges.",
    expectedPath:
      "client/src/assets/game/studentRace/road/road-side-dirt.webp",
    required: false,
    fallback: ASSET_PLACEHOLDER.NONE,
  }),

  [KEYS.PLAYER_KART]: Object.freeze({
    key: KEYS.PLAYER_KART,
    description: "The student's kart, fixed near the bottom of the screen.",
    expectedPath: "client/src/assets/game/studentRace/karts/player-kart.webp",
    required: true,
    fallback: ASSET_PLACEHOLDER.GRAPHICS,
  }),

  [KEYS.DUST_EFFECT]: Object.freeze({
    key: KEYS.DUST_EFFECT,
    description: "Dust puffs trailing behind the kart while moving.",
    expectedPath:
      "client/src/assets/game/studentRace/effects/dust-effect.webp",
    required: true,
    fallback: ASSET_PLACEHOLDER.GRAPHICS,
  }),

  [KEYS.CORRECT_EFFECT]: Object.freeze({
    key: KEYS.CORRECT_EFFECT,
    description: "Celebration burst played on a correct answer.",
    expectedPath:
      "client/src/assets/game/studentRace/effects/correct-effect.webp",
    required: false,
    fallback: ASSET_PLACEHOLDER.NONE,
  }),

  [KEYS.WRONG_EFFECT]: Object.freeze({
    key: KEYS.WRONG_EFFECT,
    description: "Gentle miss indication played on a wrong answer.",
    expectedPath:
      "client/src/assets/game/studentRace/effects/wrong-effect.webp",
    required: false,
    fallback: ASSET_PLACEHOLDER.NONE,
  }),

  [KEYS.FINISH_LINE]: Object.freeze({
    key: KEYS.FINISH_LINE,
    description:
      "Finish line entering the frame when distance-to-go is small.",
    expectedPath:
      "client/src/assets/game/studentRace/finish/finish-line.webp",
    required: true,
    fallback: ASSET_PLACEHOLDER.GRAPHICS,
  }),

  [KEYS.SMALL_TRACK_PROP]: Object.freeze({
    key: KEYS.SMALL_TRACK_PROP,
    description: "Small roadside props (stones, plants) for variety.",
    expectedPath:
      "client/src/assets/game/studentRace/props/small-track-prop-01.webp",
    required: false,
    fallback: ASSET_PLACEHOLDER.NONE,
  }),
});
