import { Graphics } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_FEEDBACK_VISUAL } from "../../config/raceFeedbackVisualConfig";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { drawFeedbackEffect } from "./drawFeedbackEffect";

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
