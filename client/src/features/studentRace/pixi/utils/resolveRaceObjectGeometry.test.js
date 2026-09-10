import { Container } from "pixi.js";
import { expect, it } from "vitest";
import { opponentFrame } from "../opponents/opponentTestFixtures.js";
import { PlayerKartLayer } from "../layers/PlayerKartLayer.js";

it.each([[360, 640], [390, 844], [520, 800], [960, 900]])(
  "preserves player pixels and aligns same-position opponents at %sx%s", (width, height) => {
    const frame = opponentFrame({ width, height });
    const player = new PlayerKartLayer(new Container());
    player.update(frame);
    const { playerKart } = frame.layout;
    const oldScale = playerKart.maxWidth / 100;
    const origin = player.root.toGlobal({ x: 0, y: 0 });
    expect(origin.x).toBeCloseTo(playerKart.anchorX - playerKart.maxWidth / 2, 8);
    expect(origin.y).toBeCloseTo(playerKart.anchorY - 64 * oldScale / 2, 8);
    const projected = frame.perspective.projectTrackObject(frame.visualPosition - frame.raceObjectCameraPosition);
    expect(projected.y).toBeCloseTo(player.root.y, 8);
    expect(projected.roadHalfWidth / frame.playerRoadHalfWidth * playerKart.maxWidth)
      .toBeCloseTo(playerKart.maxWidth, 8);
    const ahead = frame.perspective.projectTrackObject(frame.playerReferenceDistance + 2);
    const behind = frame.perspective.projectTrackObject(frame.playerReferenceDistance - 0.2);
    expect(ahead.y).toBeLessThan(projected.y);
    expect(ahead.roadHalfWidth).toBeLessThan(projected.roadHalfWidth);
    expect(behind.y).toBeGreaterThan(projected.y);
    expect(behind.roadHalfWidth).toBeGreaterThan(projected.roadHalfWidth);
    player.destroy();
  });
