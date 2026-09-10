import { Container } from "pixi.js";
import { afterEach, expect, it, vi } from "vitest";
import { OpponentKart, OPPONENT_VISIBILITY_STATES as STATES } from "./OpponentKart.js";
import { opponentFrame, fallbackVehicle } from "./opponentTestFixtures.js";
import { raceOpponent } from "../../runtime/studentRaceTestFixtures.js";

const allocated = [];
afterEach(() => { allocated.splice(0).forEach((kart) => kart.destroy()); });
async function kartAt(position, extra = {}) {
  const kart = new OpponentKart(new Container(), { loadVehicleAssets: fallbackVehicle });
  allocated.push(kart);
  kart.applySnapshot(raceOpponent({ position, positionAtEpochMs: 10000,
    movementUnitsPerSecond: 0, laneNumber: 4, ...extra }), 10000);
  await Promise.resolve();
  return kart;
}

it("bounds prediction by checkpoint age and preserves an old checkpoint across polls", async () => {
  const kart = await kartAt(100, { movementUnitsPerSecond: 6, positionAtEpochMs: 9000 });
  kart.advancePosition(1000, 1000);
  expect(kart.targetPosition).toBe(112);
  kart.applySnapshot(raceOpponent({ position: 100, positionAtEpochMs: 9000, movementUnitsPerSecond: 6 }), 11500);
  kart.advancePosition(1000, 1000);
  expect(kart.targetPosition).toBe(115);
  kart.applySnapshot(raceOpponent({ position: 100, positionAtEpochMs: 9000, movementUnitsPerSecond: 6 }), 11000);
  kart.advancePosition(10000, 1000);
  expect(kart.targetPosition).toBe(115);
  expect(kart.authoritativePosition).toBe(100);
});

it.each(["DISCONNECTED", "FINISHED", "WAITING"])("never predicts forward for %s", async (status) => {
  const kart = await kartAt(100, { status, movementUnitsPerSecond: 6 });
  kart.advancePosition(5000, 1000);
  expect(kart.targetPosition).toBe(100);
});

it("caps at total distance and smooths small corrections while snapping large corrections", async () => {
  const kart = await kartAt(100);
  kart.applySnapshot(raceOpponent({ position: 105, movementUnitsPerSecond: 0 }), 10000);
  kart.advancePosition(180, 1000);
  expect(kart.visualPosition).toBeCloseTo(100 + 5 * (1 - Math.exp(-1)));
  kart.applySnapshot(raceOpponent({ position: 998, movementUnitsPerSecond: 6 }), 10000);
  kart.advancePosition(2500, 1000);
  expect(kart.targetPosition).toBe(1000);
  expect(kart.visualPosition).toBe(1000);
});

it.each([1, 4, 8])("derives lane sides at the same physical depth for self lane %s", async (lane) => {
  const frame = opponentFrame({ lane });
  const left = await kartAt(200, { laneNumber: lane - 1 });
  const right = await kartAt(200, { laneNumber: lane + 1 });
  left.update(frame);
  right.update(frame);
  expect(left.projected.y).toBeCloseTo(right.projected.y);
  expect(left.projected.x).toBeLessThan(frame.perspective.centerX);
  expect(right.projected.x).toBeGreaterThan(frame.perspective.centerX);
});

it("retains the kart through overtaking and tiny parallel corrections until a full rear exit", async () => {
  const kart = await kartAt(200);
  for (const position of [199, 200, 200.01, 199.99, 200.2]) {
    kart.update(opponentFrame({ position, deltaMs: 200 }));
    expect(kart.visibilityState).toBe(STATES.VISIBLE);
    expect(kart.releasable).toBe(false);
  }
  const lowerY = kart.projected.y;
  kart.update(opponentFrame({ position: 201, deltaMs: 200 }));
  expect(kart.projected.y).toBeGreaterThan(lowerY);
  kart.update(opponentFrame({ position: 220, deltaMs: 200 }));
  expect(kart.visibilityState).toBe(STATES.HIDDEN);
  expect(kart.releasable).toBe(true);
});

it("does not introduce a newly discovered kart from below the question panel", async () => {
  const frame = opponentFrame();
  const kart = await kartAt(frame.raceObjectCameraPosition - 0.5);
  kart.update(frame);
  expect(kart.projected.visible).toBe(true);
  expect(kart.projected.y).toBeGreaterThan(frame.layout.world.bottomY);
  expect(kart.visibilityState).toBe(STATES.HIDDEN);
});

it("uses front hysteresis and complete bounds for side culling", async () => {
  const frame = opponentFrame({ deltaMs: 200 });
  const kart = await kartAt(frame.raceObjectCameraPosition + 145);
  kart.update(frame);
  expect(kart.visibilityState).toBe(STATES.HIDDEN);
  const atDistance = (distance) => ({ ...frame, raceObjectCameraPosition: kart.visualPosition - distance });
  kart.update(atDistance(140));
  expect(kart.visibilityState).toBe(STATES.VISIBLE);
  kart.update(atDistance(145));
  expect(kart.visibilityState).toBe(STATES.VISIBLE);
  const bounds = vi.spyOn(kart.vehicleVisual, "getBounds").mockReturnValue({ minX: -100, maxX: 1, minY: 10, maxY: 90 });
  kart.update(atDistance(145));
  expect(kart.visibilityState).toBe(STATES.VISIBLE);
  bounds.mockReturnValue({ minX: -100, maxX: -25, minY: 10, maxY: 90 });
  kart.update(atDistance(145));
  expect(kart.visibilityState).toBe(STATES.HIDDEN);
});

it("honors reduced motion without moving the projected ground anchor", async () => {
  const kart = await kartAt(200, { movementUnitsPerSecond: 1 });
  const frame = opponentFrame();
  frame.runtimeState.visual.reducedMotion = true;
  kart.update(frame);
  expect(kart.visibilityState).toBe(STATES.VISIBLE);
  expect(kart.vehicleVisual.kart.y).toBe(0);
  expect(kart.vehicleVisual.root.y).toBe(kart.projected.y);
});
