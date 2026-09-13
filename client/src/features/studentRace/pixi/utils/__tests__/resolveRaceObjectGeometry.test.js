import { Container } from "pixi.js";
import { expect, it } from "vitest";
import { opponentFrame } from "../../opponents/opponentTestFixtures.js";
import { PlayerKartLayer } from "../../layers/PlayerKartLayer.js";
import { VEHICLE_GROUND_Y, VEHICLE_UNIT_WIDTH } from "../../vehicles/studentRaceVehicleGeometry.js";

it.each([[360, 640], [390, 844], [520, 800], [960, 900]])(
  "shrinks vehicle artwork around the unchanged ground anchor and preserves small depth differences at %sx%s", (width, height) => {
    const frame = opponentFrame({ width, height });
    const player = new PlayerKartLayer(new Container());
    player.update(frame);
    const { playerKart } = frame.layout;
    const ground = player.root.toGlobal({ x: VEHICLE_UNIT_WIDTH / 2, y: VEHICLE_GROUND_Y });
    expect(ground.x).toBeCloseTo(playerKart.anchorX, 8);
    expect(ground.y).toBeCloseTo(frame.playerGroundY, 8);
    expect(player.root.scale.x * VEHICLE_UNIT_WIDTH).toBeLessThan(playerKart.maxWidth);
    const projected = frame.perspective.projectTrackObject(frame.visualPosition - frame.raceObjectCameraPosition);
    expect(projected.y).toBeCloseTo(player.root.y, 8);
    expect(projected.roadHalfWidth / frame.playerRoadHalfWidth * playerKart.maxWidth)
      .toBeCloseTo(playerKart.maxWidth, 8);
    const ahead = frame.perspective.projectTrackObject(frame.playerReferenceDistance + 0.01);
    const behind = frame.perspective.projectTrackObject(frame.playerReferenceDistance - 0.01);
    expect(ahead.y).toBeLessThan(projected.y);
    expect(ahead.roadHalfWidth).toBeLessThan(projected.roadHalfWidth);
    expect(behind.y).toBeGreaterThan(projected.y);
    expect(behind.roadHalfWidth).toBeGreaterThan(projected.roadHalfWidth);
    player.destroy();
  });
