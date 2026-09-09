import { Container } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_FINISH_GATE } from "../../config/finishGateConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";
import { resolveStudentRaceLayoutMetrics } from "../../utils/resolveStudentRaceLayoutMetrics";
import { createRacePerspective } from "../utils/createRacePerspective";
import { FinishLineLayer } from "./FinishLineLayer";

function frame(position, width = 736, height = 800) {
  const layout = resolveStudentRaceLayoutMetrics({ width, height });
  return {
    visualPosition: position,
    runtimeState: { totalDistance: 1000, playerFinished: false },
    perspective: createRacePerspective({
      width,
      widthUnit: layout.world.widthUnit,
      worldBottomY: layout.world.bottomY,
      camera: STUDENT_RACE_VISUAL_CONFIG.camera,
      viewDistanceAhead: 150,
    }),
  };
}

describe("FinishLineLayer", () => {
  it("shows only when the authoritative finish distance enters the default projection window", () => {
    const layer = new FinishLineLayer(new Container());
    const state = frame(900);
    layer.update({ ...state, runtimeState: null });
    expect(layer.isVisible).toBe(false);
    layer.update(frame(849.99));
    expect(layer.graphics.visible).toBe(false);
    layer.update(frame(850));
    expect(layer.graphics.visible).toBe(true);
    layer.update(frame(1000));
    expect(layer.graphics.visible).toBe(true);
    layer.update(frame(1000.01));
    expect(layer.graphics.visible).toBe(false);
    expect(state.runtimeState.playerFinished).toBe(false);
    layer.destroy();
  });

  it.each([[360, 640], [430, 932], [736, 800], [960, 1366]])(
    "keeps the upright gate feet locked to the finish projection at %s by %s",
    (width, height) => {
      const layer = new FinishLineLayer(new Container());
      const state = frame(970, width, height);
      const expected = state.perspective.projectTrackObject(30);
      layer.update(state);

      expect(layer.graphics.x).toBeCloseTo(expected.x);
      expect(layer.graphics.y).toBeCloseTo(expected.y);
      expect(layer.graphics.scale.x).toBeCloseTo(expected.roadHalfWidth);
      expect(layer.graphics.scale.y).toBeCloseTo(expected.roadHalfWidth);
      const gate = STUDENT_RACE_FINISH_GATE;
      const bannerBottomY = layer.graphics.y - expected.roadHalfWidth * (gate.height - gate.bannerHeight);
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
    const farScale = graphics.scale.x;
    layer.update(frame(980));
    expect(graphics.scale.x).toBeGreaterThan(farScale);
    layer.resize();
    layer.update(frame(980, 360, 640));

    expect(container.children).toEqual([graphics]);
    expect(graphics.context.instructions).toHaveLength(originalInstructions);
    expect(drawGate).not.toHaveBeenCalled();
    layer.destroy();
    expect(graphics.destroyed).toBe(true);
    expect(container.children).toHaveLength(0);
  });
});
