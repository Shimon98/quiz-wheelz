import { Graphics, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_FEEDBACK_VISUAL } from "../../../config/raceFeedbackVisualConfig";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { drawFeedbackEffect } from "../drawFeedbackEffect";

const geometry = { x: 260, y: 420, size: 177, width: 520, groundY: 443, bottomY: 518 };

function drawCorrect(streak, progress = 0.35) {
  const graphics = new Graphics();
  const stars = vi.spyOn(graphics, "star");
  drawFeedbackEffect(graphics, STUDENT_RACE_EFFECT.CORRECT, progress, {
    ...geometry,
    feedbackStreak: streak,
  });
  return { graphics, stars };
}

describe("drawFeedbackEffect", () => {
  it("uses readable star geometry and strengthens the accepted combo without adding unlimited particles", () => {
    const single = drawCorrect(1);
    const combo = drawCorrect(3);

    expect(single.stars).toHaveBeenCalledTimes(8);
    expect(combo.stars).toHaveBeenCalledTimes(8);
    expect(combo.stars.mock.calls[0][3]).toBeGreaterThan(single.stars.mock.calls[0][3]);
    single.graphics.destroy();
    combo.graphics.destroy();
  });

  it("throws the painted mud drop on a wrong answer once it is loaded, head out and highlight up", () => {
    const drop = new Texture({ source: new TextureSource({ width: 96, height: 60 }) });
    const painted = new Graphics();
    const drawn = new Graphics();

    drawFeedbackEffect(painted, STUDENT_RACE_EFFECT.WRONG, 0.4, { ...geometry, luckArt: { mudDrop: drop } });
    drawFeedbackEffect(drawn, STUDENT_RACE_EFFECT.WRONG, 0.4, geometry);

    const drops = painted.context.instructions.filter(({ action }) => action === "texture");
    expect(drops).toHaveLength(6);
    drops.forEach(({ data }) => {
      const centre = data.transform.apply({ x: 0, y: 0 });
      expect(data.image).toBe(drop);
      expect(data.transform.apply({ x: 0, y: -1 }).y).toBeLessThan(centre.y);
      expect(Math.sign(data.transform.apply({ x: 1, y: 0 }).x - centre.x)).toBe(Math.sign(centre.x - geometry.x));
    });
    expect(drawn.context.instructions.some(({ action }) => action === "texture")).toBe(false);
    painted.destroy();
    drawn.destroy();
  });

  it("caps visual strength independently of the authoritative streak value", () => {
    const capped = drawCorrect(STUDENT_RACE_FEEDBACK_VISUAL.correct.maxVisualStreak);
    const large = drawCorrect(1000);

    expect(large.stars.mock.calls).toEqual(capped.stars.mock.calls);
    capped.graphics.destroy();
    large.graphics.destroy();
  });

  it.each([0, 0.15, 0.5, 0.95])("keeps the complete correct burst localized to the kart at progress %s", (progress) => {
    const { graphics } = drawCorrect(1000, progress);
    const bounds = graphics.getLocalBounds();

    expect(bounds.width).toBeGreaterThan(geometry.size * 0.5);
    expect(bounds.width).toBeLessThan(geometry.size * 2.2);
    expect(bounds.height).toBeLessThan(geometry.size * 2.2);
    expect(bounds.minX).toBeGreaterThan(0);
    expect(bounds.maxX).toBeLessThan(geometry.width);
    graphics.destroy();
  });
});
