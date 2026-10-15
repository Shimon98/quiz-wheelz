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

  it("completes exactly one Turbo pulse per configured period", () => {
    const layer = createLayer();
    const { alpha, pulsePeriodMs } = RACE_GAMEPLAY_PRESENTATION.TURBO_TRIAL.kartAura;
    const quarter = pulsePeriodMs / 4;

    const strengths = [0, quarter, quarter, quarter, quarter].map((deltaMs) => {
      layer.update(frame("TURBO_TRIAL", { deltaMs }));
      return layer.aura.alpha / alpha;
    });

    expect(strengths[0]).toBeCloseTo(0.75);
    expect(strengths[1]).toBeCloseTo(1);
    expect(strengths[2]).toBeCloseTo(0.75);
    expect(strengths[3]).toBeCloseTo(0.5);
    expect(strengths[4]).toBeCloseTo(strengths[0]);
  });

  it("keeps the Turbo aura steady at full strength under reduced motion", () => {
    const layer = createLayer();
    const { alpha, pulsePeriodMs } = RACE_GAMEPLAY_PRESENTATION.TURBO_TRIAL.kartAura;

    for (const deltaMs of [pulsePeriodMs / 4, pulsePeriodMs / 2, pulsePeriodMs / 4]) {
      layer.update(frame("TURBO_TRIAL", { deltaMs, reducedMotion: true }));
      expect(layer.aura.alpha).toBeCloseTo(alpha);
    }
    expect(layer.aura.visible).toBe(true);
  });

  it("keeps the Safe aura steady", () => {
    const layer = createLayer();

    layer.update(frame("SAFE_RUN", { deltaMs: 300 }));

    expect(layer.aura.alpha).toBeCloseTo(RACE_GAMEPLAY_PRESENTATION.SAFE_RUN.kartAura.alpha);
  });

  it("hides the aura again when the server returns to NORMAL", () => {
    const layer = createLayer();

    layer.update(frame("SAFE_RUN"));
    layer.update(frame("NORMAL"));

    expect(layer.aura.visible).toBe(false);
  });

  it("is destroyed with the vehicle", () => {
    const layer = createLayer();

    layer.destroy();

    expect(layer.aura.destroyed).toBe(true);
  });
});
