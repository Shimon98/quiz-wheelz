import { Graphics, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_FEEDBACK_VISUAL } from "../../../config/raceFeedbackVisualConfig";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { STUDENT_RACE_EFFECT_ART } from "../../assets/studentRaceEffectManifest";
import { drawFeedbackEffect } from "../drawFeedbackEffect";

const geometry = { x: 260, y: 420, size: 177, width: 520, groundY: 443, bottomY: 518 };
const GREEN = 0x51cf66;
const GOLD = 0xfcc419;
const WHITE = 0xffffff;
const art = (width, height) => new Texture({ source: new TextureSource({ width, height }) });
const RING = art(383, 384);
const SPARKLE = art(85, 96);
const CONFETTI = Object.freeze({
  confettiRect: art(96, 74), confettiRibbon: art(96, 79), confettiStar: art(96, 92), confettiDot: art(96, 93),
});
const painted = (graphics) => graphics.context.instructions
  .filter(({ action }) => action === "texture").map(({ data }) => data);
const centreOf = ({ dx, dy, dw, dh, transform }) => transform.apply({ x: dx + dw / 2, y: dy + dh / 2 });

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

  it("paints the correct answer's rings and sparkles once their art loads: the ring green, then gold", () => {
    const graphics = new Graphics();
    const stars = vi.spyOn(graphics, "star");
    drawFeedbackEffect(graphics, STUDENT_RACE_EFFECT.CORRECT, 0.35,
      { ...geometry, feedbackStreak: 1, effectArt: { burstRing: RING, sparkle: SPARKLE } });

    expect(painted(graphics).filter(({ image }) => image === RING).map(({ style }) => style)).toEqual([GREEN, GOLD]);
    expect(painted(graphics).filter(({ image }) => image === SPARKLE)).toHaveLength(8);
    expect(stars).not.toHaveBeenCalled();
    graphics.destroy();
  });

  it("lays the painted ring's middle line on the radius the drawn ring strokes", () => {
    const drawn = new Graphics();
    const circles = vi.spyOn(drawn, "circle");
    drawFeedbackEffect(drawn, STUDENT_RACE_EFFECT.CORRECT, 0.35, { ...geometry, feedbackStreak: 3 });
    const withArt = new Graphics();
    drawFeedbackEffect(withArt, STUDENT_RACE_EFFECT.CORRECT, 0.35,
      { ...geometry, feedbackStreak: 3, effectArt: { burstRing: RING } });
    const [green] = painted(withArt);

    // The first circle is the soft disc under the kart, the second the green ring.
    expect(green.dw / 2 * STUDENT_RACE_EFFECT_ART.burstRing.radius).toBeCloseTo(circles.mock.calls[1][2]);
    expect(green.dh).toBeCloseTo(green.dw);
    expect(centreOf(green).x).toBeCloseTo(geometry.x);
    expect(centreOf(green).y).toBeCloseTo(geometry.y);
    drawn.destroy();
    withArt.destroy();
  });

  it("kicks Astra's dry dirt up on the road behind the kart on a wrong answer, the drops still flying in front", () => {
    const impact = art(512, 103);
    const drop = art(96, 60);
    const front = new Graphics();
    const behind = new Graphics();
    const ellipses = vi.spyOn(front, "ellipse");
    drawFeedbackEffect(front, STUDENT_RACE_EFFECT.WRONG, 0.4,
      { ...geometry, behind, effectArt: { groundImpact: impact }, luckArt: { mudDrop: drop } });
    const [dirt, ...more] = painted(behind);

    expect(dirt.image).toBe(impact);
    expect(more).toEqual([]);
    expect(dirt.dw / dirt.dh).toBeGreaterThan(2.5);
    expect(centreOf(dirt).x).toBeCloseTo(geometry.x);
    expect(centreOf(dirt).y).toBeCloseTo(geometry.groundY);
    expect(painted(front).map(({ image }) => image)).toEqual(Array(6).fill(drop));
    expect(ellipses).not.toHaveBeenCalled();
    front.destroy();
    behind.destroy();
  });

  it("celebrates the finish with the painted rings, gold then white, and Astra's spinning paper confetti", () => {
    const graphics = new Graphics();
    const rects = vi.spyOn(graphics, "roundRect");
    const effectArt = { burstRing: RING, ...CONFETTI };
    drawFeedbackEffect(graphics, STUDENT_RACE_EFFECT.FINISH, 0.3, { ...geometry, effectArt });
    const later = new Graphics();
    drawFeedbackEffect(later, STUDENT_RACE_EFFECT.FINISH, 0.5, { ...geometry, effectArt });
    const confetti = painted(graphics).filter(({ image }) => image !== RING);
    const turn = ({ transform }) => Math.atan2(transform.b, transform.a);

    expect(painted(graphics).filter(({ image }) => image === RING).map(({ style }) => style)).toEqual([GOLD, WHITE]);
    expect(confetti.map(({ image }) => image)).toEqual(Array.from({ length: 14 },
      (_, i) => Object.values(CONFETTI)[i % 4]));
    expect(turn(painted(later).find(({ image }) => image === CONFETTI.confettiStar)))
      .not.toBeCloseTo(turn(confetti.find(({ image }) => image === CONFETTI.confettiStar)));
    expect(rects).not.toHaveBeenCalled();
    graphics.destroy();
    later.destroy();
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
