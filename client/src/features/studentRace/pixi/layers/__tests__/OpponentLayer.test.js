import { Container } from "pixi.js";
import { expect, it } from "vitest";
import { OpponentLayer } from "../OpponentLayer.js";
import { opponentFrame, fallbackVehicle, realArtVehicle, boundsBox, coveredRatio } from "../../opponents/opponentTestFixtures.js";
import { raceOpponent } from "../../../runtime/studentRaceTestFixtures.js";
import { STUDENT_RACE_FINISH_EXPERIENCE } from "../../../config/finishExperienceConfig.js";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig.js";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../../config/raceVisualConfig.js";
import { OPPONENT_VISIBILITY_STATES as STATES } from "../../opponents/OpponentKart.js";
import { PlayerKartLayer } from "../PlayerKartLayer.js";

it("retains a completed hidden finisher so later snapshots cannot replay its crossing", async () => {
  const layer = new OpponentLayer(new Container(), { loadVehicleAssets: fallbackVehicle });
  const frame = opponentFrame({ position: 200, deltaMs: 1200 });
  frame.runtimeState.opponents = [raceOpponent({ position: 999, status: "RACING" })];
  layer.applyRuntimeState(frame.runtimeState);
  frame.runtimeState.opponents = [raceOpponent({ position: 1000, status: "FINISHED" })];
  frame.finishPresentation = { ...STUDENT_RACE_FINISH_EXPERIENCE, active: true,
    releasedFinisherIdsSet: new Set([2]), runoutDurationMs: STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs };
  layer.applyRuntimeState(frame.runtimeState);
  await Promise.resolve();
  layer.update(frame);
  const finished = layer.byPlayerId.get(2);
  finished.releasable = true;
  layer.update(frame);
  layer.applyRuntimeState(frame.runtimeState);
  expect(layer.byPlayerId.get(2)).toBe(finished);
  expect(finished.visualPosition).toBe(1006);
  expect(finished.finishRunout.elapsedMs).toBe(1200);
  expect(layer.pool).toHaveLength(0);
  layer.destroy();
});

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

it("retains and advances roster members outside the drawing window across repeated polls", async () => {
  const layer = new OpponentLayer(new Container(), { loadVehicleAssets: fallbackVehicle });
  const frame = opponentFrame();
  frame.runtimeState.opponents = [raceOpponent({ position: 600, movementUnitsPerSecond: 6 })];
  layer.applyRuntimeState(frame.runtimeState);
  const kart = layer.byPlayerId.get(2);
  layer.update(frame);
  const previous = kart.visualPosition;
  layer.applyRuntimeState(frame.runtimeState);
  layer.update(frame);
  expect(layer.byPlayerId.get(2)).toBe(kart);
  expect(kart.visualPosition).toBeGreaterThanOrEqual(previous);
  expect(kart.vehicleVisual.root.visible).toBe(false);
  expect(layer.pool).toHaveLength(0);
  layer.destroy();
});

async function fieldAtDepth(depth, size = {}) {
  const layer = new OpponentLayer(new Container(), { loadVehicleAssets: fallbackVehicle });
  const frame = opponentFrame({ deltaMs: 200, ...size });
  frame.runtimeState.playerCount = 8;
  frame.runtimeState.opponents = [1, 2, 3, 5, 6, 7, 8].map((laneNumber) => raceOpponent({
    racePlayerId: laneNumber + 100, laneNumber, movementUnitsPerSecond: 0,
    position: frame.raceObjectCameraPosition + frame.perspective.distanceAtDepth(depth),
  }));
  layer.applyRuntimeState(frame.runtimeState);
  await Promise.resolve();
  layer.update(frame);
  return { layer, frame };
}

it.each([[0.85, 2], [0.5, 4], [0.25, 7]])("limits selected opponents at real depth %s to %s while retaining all seven", async (depth, budget) => {
  const { layer, frame } = await fieldAtDepth(depth);
  const initial = [...layer.selected.keys()];
  expect(initial).toHaveLength(budget);
  if (budget === 2) expect(initial).toEqual([103, 105]);
  expect(layer.byPlayerId.size).toBe(7);
  frame.runtimeState.opponents.reverse();
  layer.applyRuntimeState(frame.runtimeState);
  layer.update(frame);
  expect([...layer.selected.keys()]).toEqual(initial);
  layer.destroy();
});

it("keeps the near incumbents through small zone-boundary jitter then expands after a real mid transition", async () => {
  const { layer, frame } = await fieldAtDepth(0.71);
  const position = frame.runtimeState.opponents[0].position;
  for (const depth of [0.695, 0.705, 0.685, 0.71]) {
    layer.update({ ...frame, raceObjectCameraPosition: position - frame.perspective.distanceAtDepth(depth) });
    expect([...layer.selected.keys()]).toEqual([103, 105]);
    expect(layer.byPlayerId.get(103).visibilityState).toBe(STATES.VISIBLE);
  }
  layer.update({ ...frame, raceObjectCameraPosition: position - frame.perspective.distanceAtDepth(0.66) });
  expect(layer.selected.size).toBe(4);
  expect(layer.selected.has(103)).toBe(true);
  expect(layer.selected.has(105)).toBe(true);
  layer.destroy();
});

it("reserves an exiting incumbent's slot until its complete rear exit", async () => {
  const { layer, frame } = await fieldAtDepth(0.85, { width: 1440, height: 1040 });
  const kart = layer.byPlayerId.get(103);
  const other = layer.byPlayerId.get(105);
  const origin = frame.raceObjectCameraPosition;
  const hidden = layer.byPlayerId.get(102);
  for (const target of [other, hidden]) {
    target.applySnapshot(raceOpponent({ racePlayerId: target.racePlayerId, laneNumber: target.laneNumber,
      position: target.authoritativePosition + 1, movementUnitsPerSecond: 0 }), 11000);
  }
  for (let index = 0; index < 1000; index += 1) layer.update({ ...frame, deltaMs: 16 });
  let shifted;
  for (let offset = 0; offset < 10 && kart.visibilityState !== STATES.EXITING; offset += 0.01) {
    shifted = { ...frame, deltaMs: 16, raceObjectCameraPosition: origin + offset };
    layer.update(shifted);
  }
  expect(kart.visibilityState).toBe(STATES.EXITING);
  expect(layer.selected.has(103)).toBe(true);
  expect(hidden.visibilityState).toBe(STATES.HIDDEN);
  while (kart.visibilityState !== STATES.HIDDEN) {
    layer.update(shifted);
    expect(layer.selected.has(103)).toBe(true);
    expect(hidden.visibilityState).toBe(STATES.HIDDEN);
  }
  layer.update(shifted);
  expect(layer.selected.has(103)).toBe(false);
  expect(hidden.visibilityState).toBe(STATES.ENTERING);
  layer.destroy();
});

async function alongsideField({ width, height, selfLane }) {
  const layer = new OpponentLayer(new Container(), { loadVehicleAssets: realArtVehicle });
  const frame = opponentFrame({ width, height, lane: selfLane, deltaMs: 200 });
  frame.runtimeState.playerCount = 8;
  frame.runtimeState.opponents = [1, 2, 3, 4, 5, 6, 7, 8].filter((lane) => lane !== selfLane).map((laneNumber) =>
    raceOpponent({ racePlayerId: laneNumber + 100, laneNumber, movementUnitsPerSecond: 0, position: 200, positionAtEpochMs: 10000 }));
  const player = new PlayerKartLayer(new Container(), { loadVehicleAssets: realArtVehicle });
  player.setVehicleAssetKey("TOY_CAR_GREEN");
  layer.applyRuntimeState(frame.runtimeState);
  await Promise.resolve();
  await Promise.resolve();
  player.update(frame);
  layer.update(frame);
  return { layer, frame, player };
}

const gapBetween = (a, b) => Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX);

it.each([[360, 640, 1], [375, 667, 1], [360, 740, 1], [412, 915, 1], [768, 1024, 1], [1440, 1040, 2], [1024, 600, 2]])(
  "keeps nearby cars readable without crowding the player or each other at %sx%s", async (width, height, nearSlots) => {
    for (const selfLane of [1, 4, 8]) {
      const { layer, frame, player } = await alongsideField({ width, height, selfLane });
      const selected = [...layer.selected.keys()];
      const expectedLanes = selfLane === 1 ? [2, 3].slice(0, nearSlots) : selfLane === 8 ? [7, 6].slice(0, nearSlots).sort() : [3, 5];
      expect(selected.map((id) => id - 100).sort()).toEqual(expectedLanes);
      const ownBounds = boundsBox(player.getBounds());
      const minGap = (ownBounds.maxX - ownBounds.minX) * 0.15;
      for (const id of selected) {
        const kart = layer.byPlayerId.get(id);
        expect(kart.visibilityState).not.toBe(STATES.HIDDEN);
        expect(kart.vehicleVisual.root.visible).toBe(true);
        const bounds = boundsBox(kart.vehicleVisual.getBounds());
        expect(gapBetween(bounds, ownBounds)).toBeGreaterThan(minGap);
        for (const otherId of selected.filter((other) => other !== id)) {
          const otherBounds = boundsBox(layer.byPlayerId.get(otherId).vehicleVisual.getBounds());
          expect(coveredRatio(bounds, otherBounds)).toBe(0);
          if (Math.sign(id - 100 - selfLane) === Math.sign(otherId - 100 - selfLane)) {
            expect(gapBetween(bounds, otherBounds)).toBeGreaterThan(minGap);
          }
        }
        expect(bounds.minX).toBeGreaterThanOrEqual(-1);
        expect(bounds.maxX).toBeLessThanOrEqual(width + 1);
      }
      expect(layer.byPlayerId.size).toBe(7);
      frame.runtimeState.opponents.reverse();
      layer.applyRuntimeState(frame.runtimeState);
      layer.update(frame);
      expect([...layer.selected.keys()]).toEqual(selected);
      layer.destroy();
      player.destroy();
    }
  });

it("never drops the single adjacent opponent of a two-player race for a density reason", async () => {
  const layer = new OpponentLayer(new Container(), { loadVehicleAssets: realArtVehicle });
  const base = opponentFrame({ width: 390, height: 844, position: 200, lane: 1, deltaMs: 200 });
  base.runtimeState.playerCount = 2;
  base.runtimeState.opponents = [raceOpponent({ racePlayerId: 2, laneNumber: 2, position: 230, movementUnitsPerSecond: 0, positionAtEpochMs: 10000 })];
  layer.applyRuntimeState(base.runtimeState);
  await Promise.resolve();
  const kart = layer.byPlayerId.get(2);
  for (const own of [200, 215, 229, 230, 230.5, 231]) {
    layer.update({ ...base, raceObjectCameraPosition: own - base.playerReferenceDistance, visualPosition: own });
    expect(layer.selected.has(2)).toBe(true);
    expect(kart.visibilityState).not.toBe(STATES.HIDDEN);
    expect(kart.vehicleVisual.root.visible).toBe(true);
  }
  layer.destroy();
});

it("shows a level same-side car only where its own lane fits, so a fourth driver never stacks on the third", async () => {
  const layer = new OpponentLayer(new Container(), { loadVehicleAssets: realArtVehicle });
  const frame = opponentFrame({ width: 390, height: 844, position: 200, lane: 1, deltaMs: 200 });
  frame.runtimeState.playerCount = 4;
  const positions = { 2: 200, 3: 200, 4: 200 };
  const apply = async () => {
    frame.runtimeState.opponents = [2, 3, 4].map((laneNumber) => raceOpponent({ racePlayerId: laneNumber, laneNumber,
      position: positions[laneNumber], movementUnitsPerSecond: 0, positionAtEpochMs: 10000 }));
    layer.applyRuntimeState(frame.runtimeState);
    await Promise.resolve();
    await Promise.resolve();
    for (let index = 0; index < 30; index += 1) layer.update(frame);
    const visible = [...layer.byPlayerId.values()].filter((kart) => kart.vehicleVisual.root.visible);
    for (const kart of visible) {
      for (const other of visible.filter((candidate) => candidate !== kart)) {
        expect(coveredRatio(boundsBox(kart.vehicleVisual.getBounds()), boundsBox(other.vehicleVisual.getBounds()))).toBe(0);
      }
    }
    return visible.map((kart) => kart.laneNumber).sort();
  };
  const lateralRatio = (lane) => {
    const { x, roadHalfWidth } = layer.byPlayerId.get(lane).projected;
    return (x - frame.perspective.centerX) / roadHalfWidth;
  };
  expect(await apply()).toEqual([2]);
  positions[2] = 215;
  expect(await apply()).toEqual([2]);
  expect(layer.zones.get(2)).toBe("mid");
  positions[3] = 215;
  expect(await apply()).toEqual([2, 3]);
  expect(lateralRatio(3)).toBeCloseTo(2 * frame.laneStepRatio, 6);
  positions[4] = 215;
  expect(await apply()).toEqual([2, 3]);
  positions[4] = 300;
  expect(await apply()).toEqual([2, 3, 4]);
  expect(layer.zones.get(4)).toBe("far");
  expect(lateralRatio(4)).toBeGreaterThan(2 * frame.laneStepRatio);
  expect(lateralRatio(4)).toBeLessThan(STUDENT_RACE_VISUAL_CONFIG.opponents.roadClearanceRatio);
  layer.destroy();
});
