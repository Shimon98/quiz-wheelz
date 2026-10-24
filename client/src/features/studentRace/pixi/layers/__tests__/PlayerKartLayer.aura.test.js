import { Container } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { RACE_GAMEPLAY_PRESENTATION } from "../../../config/raceGameplayPresentationConfig";
import { PlayerKartLayer } from "../PlayerKartLayer";

function createLayer() {
  return new PlayerKartLayer(new Container(), { loadVehicleAssets: vi.fn() });
}

function frame(mode, { reducedMotion = false, deltaMs = 100 } = {}) {
  return {
    deltaMs,
    visualSpeed: 1,
    layout: { playerKart: { maxWidth: 170, anchorX: 260, anchorY: 420 } },
    runtimeState: { gameplay: { mode }, visual: { reducedMotion } },
  };
}

describe("PlayerKartLayer gameplay aura", () => {
  it("sits on the ground between the shadow and the kart", () => {
    const layer = createLayer();
    const auraIndex = layer.root.getChildIndex(layer.aura);

    expect(auraIndex).toBeGreaterThan(layer.root.getChildIndex(layer.shadow));
    expect(auraIndex).toBeLessThan(layer.root.getChildIndex(layer.kart));
  });

  it.each(["NORMAL", "CHALLENGE_CHOICE", "FUTURE_MODE", undefined])("stays hidden in mode %s", (mode) => {
    const layer = createLayer();

    layer.update(frame(mode));

    expect(layer.aura.visible).toBe(false);
  });

  it.each(["TURBO_TRIAL", "SAFE_RUN"])("shows the %s color from the presentation config", (mode) => {
    const layer = createLayer();

    layer.update(frame(mode));

    expect(layer.aura.visible).toBe(true);
    expect(layer.aura.tint).toBe(RACE_GAMEPLAY_PRESENTATION[mode].kartAura.color);
  });

  it("keeps the restrained Turbo ground light steady throughout the mode", () => {
    const layer = createLayer();
    const { alpha } = RACE_GAMEPLAY_PRESENTATION.TURBO_TRIAL.kartAura;
    layer.update(frame("TURBO_TRIAL", { deltaMs: 400 }));
    for (const deltaMs of [0, 200, 400, 800]) {
      layer.update(frame("TURBO_TRIAL", { deltaMs }));
      expect(layer.aura.alpha).toBeCloseTo(alpha);
    }
  });

  it("keeps the Turbo aura steady at full strength under reduced motion", () => {
    const layer = createLayer();
    const { alpha } = RACE_GAMEPLAY_PRESENTATION.TURBO_TRIAL.kartAura;

    for (const deltaMs of [200, 400, 200]) {
      layer.update(frame("TURBO_TRIAL", { deltaMs, reducedMotion: true }));
      expect(layer.aura.alpha).toBeCloseTo(alpha);
    }
    expect(layer.aura.visible).toBe(true);
  });

  it("keeps the Safe aura steady", () => {
    const layer = createLayer();

    layer.update(frame("SAFE_RUN", { deltaMs: 400 }));

    expect(layer.aura.alpha).toBeCloseTo(RACE_GAMEPLAY_PRESENTATION.SAFE_RUN.kartAura.alpha);
  });

  it("fades the aura in and out with the pose instead of popping", () => {
    const layer = createLayer();

    const peak = RACE_GAMEPLAY_PRESENTATION.SAFE_RUN.kartAura.alpha;
    layer.update(frame("SAFE_RUN", { deltaMs: 160 }));
    expect(layer.aura.alpha).toBeCloseTo(peak / 2);
    layer.update(frame("SAFE_RUN", { deltaMs: 160 }));
    expect(layer.aura.alpha).toBeCloseTo(peak);
    layer.update(frame("NORMAL", { deltaMs: 160 }));
    expect(layer.aura.alpha).toBeCloseTo(peak / 2);
    layer.update(frame("NORMAL", { deltaMs: 160 }));
    expect(layer.aura.visible).toBe(false);
  });

  it("settles immediately when reduced motion is enabled during the fade", () => {
    const layer = createLayer();
    layer.update(frame("SAFE_RUN", { deltaMs: 80 }));
    layer.update(frame("NORMAL", { deltaMs: 0, reducedMotion: true }));
    expect(layer.aura.visible).toBe(false);
    expect(layer.aura.alpha).toBe(0);
  });

  it("is destroyed with the vehicle", () => {
    const layer = createLayer();

    layer.destroy();

    expect(layer.aura.destroyed).toBe(true);
  });
});
