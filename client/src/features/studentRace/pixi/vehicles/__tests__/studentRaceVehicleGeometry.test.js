import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";

import { opponentFrame } from "../../opponents/opponentTestFixtures";
import { StudentRaceVehicleVisual } from "../StudentRaceVehicleVisual";
import {
  KART_SHIELD_BUBBLE,
  kartLocalToScreen,
  playerKartFrame,
  playerKartGroundTransform,
  VEHICLE_GROUND_Y,
} from "../studentRaceVehicleGeometry";

describe("playerKartFrame", () => {
  it.each([[360, 640], [390, 844], [768, 1024], [960, 800]])(
    "puts a kart-local point where the player's kart draws it at %sx%s",
    (width, height) => {
      const { layout, vehicleVisualScale } = opponentFrame({ width, height });
      const visual = new StudentRaceVehicleVisual(new Container());
      visual.setGroundTransform({ ...playerKartGroundTransform(layout), visualScale: vehicleVisualScale });
      const frame = playerKartFrame(layout, vehicleVisualScale);

      for (const [x, y] of [[50, VEHICLE_GROUND_Y], [0, -40], [KART_SHIELD_BUBBLE.x + KART_SHIELD_BUBBLE.radiusX, 8]]) {
        const drawn = visual.root.toGlobal({ x, y });
        const placed = kartLocalToScreen(frame, x, y);
        expect(placed.x).toBeCloseTo(drawn.x);
        expect(placed.y).toBeCloseTo(drawn.y);
      }
    },
  );
});
