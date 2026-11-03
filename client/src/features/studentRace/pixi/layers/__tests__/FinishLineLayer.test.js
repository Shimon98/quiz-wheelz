import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_FINISH_GATE } from "../../../config/finishGateConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../../config/raceVisualConfig";
import { resolveStudentRaceLayoutMetrics } from "../../../utils/resolveStudentRaceLayoutMetrics";
import { STUDENT_RACE_EFFECT_ART } from "../../assets/studentRaceEffectManifest";
import { createRacePerspective } from "../../utils/createRacePerspective";
import { FinishLineLayer } from "../FinishLineLayer";
import { resolveRaceObjectGeometry } from "../../utils/resolveRaceObjectGeometry.js";

function frame(position, width = 736, height = 800) {
  const layout = resolveStudentRaceLayoutMetrics({ width, height });
  const perspective = createRacePerspective({
      width,
      widthUnit: layout.world.widthUnit,
      worldBottomY: layout.world.bottomY,
      camera: STUDENT_RACE_VISUAL_CONFIG.camera,
      viewDistanceAhead: 150,
    });
  const geometry = resolveRaceObjectGeometry(layout, perspective);
  return {
    ...geometry,
    raceObjectCameraPosition: position - geometry.playerReferenceDistance,
    runtimeState: { totalDistance: 1000, playerFinished: false },
    perspective,
  };
}

describe("FinishLineLayer", () => {
  it("shows only when the authoritative finish distance enters the default projection window", () => {
    const layer = new FinishLineLayer(new Container());
    const state = frame(900);
    layer.update({ ...state, runtimeState: null });
    expect(layer.isVisible).toBe(false);
    layer.update(frame(849.99 + state.playerReferenceDistance));
    expect(layer.gate.visible).toBe(false);
    layer.update(frame(850 + state.playerReferenceDistance));
    expect(layer.gate.visible).toBe(true);
    layer.update(frame(1000));
    expect(layer.gate.visible).toBe(true);
    expect(layer.gate.y).toBeCloseTo(state.playerGroundY);
    layer.update(frame(1000.01 + state.playerReferenceDistance));
    expect(layer.gate.visible).toBe(false);
    expect(state.runtimeState.playerFinished).toBe(false);
    layer.destroy();
  });

  it.each([[360, 640], [430, 932], [736, 800], [960, 1366]])(
    "keeps the upright gate feet locked to the finish projection at %s by %s",
    (width, height) => {
      const layer = new FinishLineLayer(new Container());
      const state = frame(970, width, height);
      const expected = state.perspective.projectTrackObject(30 + state.playerReferenceDistance);
      layer.update(state);

      expect(layer.gate.x).toBeCloseTo(expected.x);
      expect(layer.gate.y).toBeCloseTo(expected.y);
      expect(layer.gate.scale.x).toBeCloseTo(expected.roadHalfWidth);
      expect(layer.gate.scale.y).toBeCloseTo(expected.roadHalfWidth);
      const gate = STUDENT_RACE_FINISH_GATE;
      const bannerBottomY = layer.gate.y - expected.roadHalfWidth * (gate.height - gate.bannerHeight);
      expect(bannerBottomY).toBeLessThan(expected.y);
      expect(gate.poleLateralRatio - gate.poleWidth / 2).toBeGreaterThan(0.98);
      layer.destroy();
    },
  );

  it("reuses its drawn geometry while approaching and resizing", () => {
    const container = new Container();
    const layer = new FinishLineLayer(container);
    const graphics = layer.graphics;
    const drawGate = vi.spyOn(layer, "drawGate");
    const originalInstructions = graphics.context.instructions.length;
    layer.update(frame(900));
    const farScale = layer.gate.scale.x;
    layer.update(frame(980));
    expect(layer.gate.scale.x).toBeGreaterThan(farScale);
    layer.resize();
    layer.update(frame(980, 360, 640));

    expect(container.children).toEqual([layer.gate]);
    expect(graphics.context.instructions).toHaveLength(originalInstructions);
    expect(drawGate).not.toHaveBeenCalled();
    layer.destroy();
    expect(graphics.destroyed).toBe(true);
    expect(container.children).toHaveLength(0);
  });
  it("raises Astra's painted gate once it loads, pinned, its feet where the drawn poles stand", async () => {
    const art = new Texture({ source: new TextureSource({ width: 1024, height: 512 }) });
    const prepareTexture = vi.fn();
    const layer = new FinishLineLayer(new Container(), { loadTexture: async () => art, prepareTexture });

    expect(await layer.artPromise).toBe(true);
    const painted = layer.gate.children.at(-1);
    const { anchorX, anchorY, feetApart } = STUDENT_RACE_EFFECT_ART.finishGate;
    expect(painted.texture).toBe(art);
    expect(prepareTexture).toHaveBeenCalledWith(art);
    expect([painted.anchor.x, painted.anchor.y]).toEqual([anchorX, anchorY]);
    expect([painted.x, painted.y]).toEqual([0, 0]);
    expect(painted.width * feetApart / 2).toBeCloseTo(STUDENT_RACE_FINISH_GATE.poleLateralRatio);
    expect(painted.height).toBeCloseTo(painted.width * 512 / 1024);
    expect(layer.graphics.visible).toBe(false);
    layer.destroy();
  });

  it("keeps the drawn gate when the painting fails, or arrives after the race screen is gone", async () => {
    const failing = new FinishLineLayer(new Container(), { loadTexture: async () => { throw new Error("404"); } });
    expect(await failing.artPromise).toBe(false);
    expect(failing.gate.children).toEqual([failing.graphics]);
    expect(failing.graphics.visible).toBe(true);
    failing.destroy();

    let finish = null;
    const pending = new Promise((resolve) => { finish = resolve; });
    const prepareTexture = vi.fn();
    const late = new FinishLineLayer(new Container(), { loadTexture: () => pending, prepareTexture });
    late.destroy();
    finish(new Texture({ source: new TextureSource({ width: 1024, height: 512 }) }));
    expect(await late.artPromise).toBe(false);
    expect(prepareTexture).not.toHaveBeenCalled();
  });
});
