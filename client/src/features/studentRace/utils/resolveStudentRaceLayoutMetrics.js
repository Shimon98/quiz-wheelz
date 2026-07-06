import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";

/*
 * THE single numeric implementation of the screen layout contract (G).
 * Input: the canvas size. Output: where the question panel sits, the
 * VISIBLE world area above it (which the renderer composes the whole
 * perspective against), and the kart/dust anchors inside that area — so
 * the Pixi world and the DOM overlay can never disagree about geometry.
 *
 * Pure function of (width, height) + config; the renderer calls it on
 * resize only.
 */
export function resolveStudentRaceLayoutMetrics({ width, height }) {
  const { layout, playerKart } = STUDENT_RACE_VISUAL_CONFIG;
  const panelConfig = layout.questionPanel;

  // Mirrors the DOM panel's CSS clamp(minHeight, ratio*100dvh, maxHeight).
  const questionPanelHeight = Math.min(
    panelConfig.maxHeight,
    Math.max(panelConfig.minHeight, height * panelConfig.heightRatio),
  );
  const questionPanelTopY = height - questionPanelHeight;

  // The world is composed against the visible strip above the panel, plus
  // the small overlap peeking behind the panel's rounded top.
  const worldBottomY = questionPanelTopY + panelConfig.topOverlap;

  const anchorY = worldBottomY * layout.world.playerKartAnchorYRatio;

  return {
    questionPanel: {
      height: questionPanelHeight,
      topY: questionPanelTopY,
      sideInset: panelConfig.sideInset,
    },

    world: {
      topY: 0,
      bottomY: worldBottomY,
      height: worldBottomY,
    },

    playerKart: {
      anchorX: width * playerKart.screenXRatio,
      anchorY,
      maxWidth: width * playerKart.maxWidthRatio,
      // Dust spawns just behind the kart, in visible-world units.
      dustOriginY: anchorY + worldBottomY * 0.045,
    },

    hud: {
      topInset: layout.hud.topInset,
      sideInset: layout.hud.sideInset,
      minHeight: layout.hud.minHeight,
    },
  };
}
