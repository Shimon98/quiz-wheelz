import { Sprite, Texture, TextureSource } from "pixi.js";
import { describe, expect, it } from "vitest";

import { KartArtCrossfade } from "../KartArtCrossfade";

const texture = () => new Texture({ source: new TextureSource({ width: 768, height: 768 }) });
const IDLE = texture();
const TURBO = texture();
const SAFE = texture();

function setup(durationMs = 200) {
  const base = new Sprite(IDLE);
  const overlay = new Sprite(IDLE);
  const fade = new KartArtCrossfade(durationMs);
  fade.attach(base, overlay);
  return { base, overlay, fade };
}

describe("KartArtCrossfade", () => {
  it("fades a new pose in over the fade time, then commits it to the base art", () => {
    const { base, overlay, fade } = setup();

    fade.show(TURBO, { deltaMs: 16 });
    expect(base.texture).toBe(IDLE);
    expect(overlay.visible).toBe(true);
    expect(overlay.texture).toBe(TURBO);
    fade.show(TURBO, { deltaMs: 80 });
    expect(overlay.alpha).toBeGreaterThan(0.3);
    expect(overlay.alpha).toBeLessThan(1);
    fade.show(TURBO, { deltaMs: 120 });

    expect(base.texture).toBe(TURBO);
    expect(overlay.visible).toBe(false);
  });

  it("swaps at once under reduced motion", () => {
    const { base, overlay, fade } = setup();

    fade.show(SAFE, { deltaMs: 16, instant: true });

    expect(base.texture).toBe(SAFE);
    expect(overlay.visible).toBe(false);
  });

  it("fades the outgoing silhouette and restores full opacity when the pose settles", () => {
    const { base, overlay, fade } = setup();
    fade.show(TURBO, { deltaMs: 90 });
    expect(base.alpha).toBeGreaterThan(0);
    expect(base.alpha).toBeLessThan(1);
    expect(base.alpha + overlay.alpha).toBeCloseTo(1);
    expect(base.parent).toBe(overlay.parent);
    expect(overlay.blendMode).toBe("add");
    expect(fade.filter.enabled).toBe(true);
    fade.show(TURBO, { deltaMs: 200 });
    expect(base.alpha).toBe(1);
    expect(fade.filter.enabled).toBe(false);
  });

  it("settles an active transition when reduced motion is enabled mid-transition", () => {
    const { base, overlay, fade } = setup();
    fade.show(TURBO, { deltaMs: 60 });
    fade.show(TURBO, { deltaMs: 1, instant: true });
    expect(base.texture).toBe(TURBO);
    expect(base.alpha).toBe(1);
    expect(overlay.visible).toBe(false);
    expect(fade.filter.enabled).toBe(false);
  });

  it("ends on the latest pose when the mode changes again mid-fade", () => {
    const { base, fade } = setup();

    fade.show(TURBO, { deltaMs: 50 });
    fade.show(IDLE, { deltaMs: 16 });
    for (let i = 0; i < 20; i += 1) fade.show(IDLE, { deltaMs: 16 });

    expect(base.texture).toBe(IDLE);
  });

  it("reverses a transition continuously when the server changes mode mid-blend", () => {
    const { base, overlay, fade } = setup();
    fade.show(SAFE, { deltaMs: 80 });
    const safeWeight = overlay.alpha;
    fade.show(IDLE, { deltaMs: 0 });
    expect(base.texture).toBe(SAFE);
    expect(base.alpha).toBeCloseTo(safeWeight);
    expect(overlay.texture).toBe(IDLE);
    expect(overlay.alpha).toBeCloseTo(1 - safeWeight);
  });

  it("releases its isolated surface without destroying shared textures", () => {
    const { base, overlay, fade } = setup();
    const surface = fade.surface;
    const filter = fade.filter;
    fade.detach();
    expect(surface.destroyed).toBe(true);
    expect(filter.resources).toBeNull();
    expect(base.destroyed).toBe(false);
    expect(overlay.destroyed).toBe(false);
    expect(IDLE.destroyed).toBe(false);
  });

  it("inherits renderer resolution and antialiasing instead of downsampling sharp art", () => {
    const { fade } = setup();
    expect(fade.filter.resolution).toBe("inherit");
    expect(fade.filter.antialias).toBe("inherit");
    fade.detach();
  });

  it("can return faster without changing the incoming transition or jumping on reversal", () => {
    const { base, overlay, fade } = setup(320);
    fade.show(TURBO, { deltaMs: 320 });
    fade.show(IDLE, { deltaMs: 80, durationMs: 160 });
    expect(overlay.alpha).toBeCloseTo(0.5);
    fade.show(TURBO, { deltaMs: 0, durationMs: 320 });
    expect(base.alpha).toBeCloseTo(0.5);
    expect(overlay.alpha).toBeCloseTo(0.5);
    fade.show(TURBO, { deltaMs: 160 });
    expect(base.texture).toBe(TURBO);
    expect(overlay.visible).toBe(false);
  });

  it("does nothing while the requested art is already shown", () => {
    const { base, overlay, fade } = setup();

    fade.show(IDLE, { deltaMs: 16 });

    expect(base.texture).toBe(IDLE);
    expect(overlay.visible).toBe(false);
  });

  // The ticker updates (show) before it renders, so the filter must survive one update to be drawn once.
  it("warms the blend filter up for exactly one rendered frame without changing the picture", () => {
    const { base, overlay, fade } = setup();

    fade.prewarm();
    expect(fade.filter.enabled).toBe(true);
    expect(overlay.visible).toBe(false);
    expect(base.alpha).toBe(1);

    fade.show(IDLE, { deltaMs: 16 });
    expect(fade.filter.enabled).toBe(true);
    fade.show(IDLE, { deltaMs: 16 });
    expect(fade.filter.enabled).toBe(false);
    expect(base.texture).toBe(IDLE);
  });

  it("lets a real transition take over the filter during a warm-up", () => {
    const { base, overlay, fade } = setup();

    fade.prewarm();
    fade.show(TURBO, { deltaMs: 16 });
    expect(overlay.visible).toBe(true);
    expect(fade.filter.enabled).toBe(true);
    for (let i = 0; i < 20; i += 1) fade.show(TURBO, { deltaMs: 16 });

    expect(base.texture).toBe(TURBO);
    expect(fade.filter.enabled).toBe(false);
  });

  it("ignores a warm-up after it has been released", () => {
    const { fade } = setup();
    fade.detach();

    expect(() => fade.prewarm()).not.toThrow();
  });
});
