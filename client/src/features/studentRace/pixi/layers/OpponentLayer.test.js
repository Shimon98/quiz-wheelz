import { Container } from "pixi.js";
import { expect, it } from "vitest";
import { OpponentLayer } from "./OpponentLayer.js";
import { opponentFrame, fallbackVehicle } from "../opponents/opponentTestFixtures.js";
import { raceOpponent } from "../../runtime/studentRaceTestFixtures.js";

it.each([1, 7])("preserves %s player identities on reordered polls without reallocating visuals", async (count) => {
  const world = new Container();
  world.sortableChildren = true;
  const layer = new OpponentLayer(world, { loadVehicleAssets: fallbackVehicle });
  const frame = opponentFrame({ deltaMs: 200 });
  frame.runtimeState.opponents = Array.from({ length: count }, (_, index) =>
    raceOpponent({ racePlayerId: index + 2, position: 201 + index, laneNumber: index + 1 }));
  layer.applyRuntimeState(frame.runtimeState);
  await Promise.resolve();
  layer.update(frame);
  const original = new Map(layer.byPlayerId);
  const roots = [...original.values()].map((kart) => kart.vehicleVisual.root);
  frame.runtimeState.opponents.reverse();
  layer.applyRuntimeState(frame.runtimeState);
  layer.update(frame);
  expect(layer.byPlayerId.size).toBe(count);
  for (const [id, kart] of original) {
    expect(layer.byPlayerId.get(id)).toBe(kart);
    expect(kart.vehicleVisual.root.parent).toBe(world);
    expect(kart.vehicleVisual.root.zIndex).toBe(kart.projected.depth);
  }
  expect(world.children).toEqual(roots);
  layer.destroy();
  expect(world.children).toHaveLength(0);
});

it("shares depth sorting with scenery and reuses an instance after a real exit", async () => {
  const world = new Container();
  world.sortableChildren = true;
  const scenery = new Container();
  world.addChild(scenery);
  const layer = new OpponentLayer(world, { loadVehicleAssets: fallbackVehicle });
  const frame = opponentFrame({ deltaMs: 200 });
  frame.runtimeState.opponents = [raceOpponent({ position: 200, laneNumber: 4, movementUnitsPerSecond: 0 })];
  layer.applyRuntimeState(frame.runtimeState);
  await Promise.resolve();
  layer.update(frame);
  const first = layer.byPlayerId.get(2);
  scenery.zIndex = first.projected.depth + 0.01;
  world.sortChildren();
  expect(world.children.indexOf(scenery)).toBeGreaterThan(world.children.indexOf(first.vehicleVisual.root));
  scenery.zIndex = first.projected.depth - 0.01;
  world.sortChildren();
  expect(world.children.indexOf(scenery)).toBeLessThan(world.children.indexOf(first.vehicleVisual.root));
  frame.runtimeState.opponents = [];
  layer.applyRuntimeState(frame.runtimeState);
  layer.update(frame);
  expect(layer.pool).toEqual([first]);
  expect(layer.byPlayerId.size).toBe(0);
  frame.runtimeState.opponents = [raceOpponent({ racePlayerId: 3 })];
  layer.applyRuntimeState(frame.runtimeState);
  expect(layer.byPlayerId.get(3)).toBe(first);
  expect(layer.pool).toHaveLength(0);
  layer.destroy();
  scenery.destroy();
});
