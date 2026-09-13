import { Container } from "pixi.js";
import { afterEach, expect, it, vi } from "vitest";
import { OpponentKart, OPPONENT_VISIBILITY_STATES as STATES } from "../OpponentKart.js";
import { opponentFrame, fallbackVehicle, realArtVehicle, boundsBox, coveredRatio } from "../opponentTestFixtures.js";
import { raceOpponent } from "../../../runtime/studentRaceTestFixtures.js";
import { STUDENT_RACE_FINISH_EXPERIENCE } from "../../../config/finishExperienceConfig.js";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig.js";
import { createStudentRaceMotion } from "../../utils/studentRaceMotion.js";
import { PlayerKartLayer } from "../../layers/PlayerKartLayer.js";

const allocated = [];

afterEach(() => { allocated.splice(0).forEach((kart) => kart.destroy()); });
async function kartAt(position, extra = {}, loadVehicleAssets = fallbackVehicle) {
  const kart = new OpponentKart(new Container(), { loadVehicleAssets });
  allocated.push(kart);
  kart.applySnapshot(raceOpponent({ position, positionAtEpochMs: 10000,
    movementUnitsPerSecond: 0, laneNumber: 4, ...extra }), 10000, 1000);
  await Promise.resolve();
  return kart;
}

it("holds a server-finished opponent until release, then runs out once without changing truth", async () => {
  const kart = await kartAt(1000);
  kart.applySnapshot(raceOpponent({ position: 1000, status: "FINISHED", finishedAtEpochMs: 9999 }), 10000);
  const presentation = { ...STUDENT_RACE_FINISH_EXPERIENCE, active: true,
    releasedFinisherIdsSet: new Set(), runoutDurationMs: STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs };
  kart.advancePosition(3000, 1000, presentation);
  expect(kart.visualPosition).toBe(999.85);
  presentation.releasedFinisherIdsSet.add(kart.racePlayerId);
  kart.advancePosition(600, 1000, presentation);
  expect(kart.visualPosition).toBe(1000);
  kart.applySnapshot(raceOpponent({ position: 1000, status: "FINISHED", finishedAtEpochMs: 9999 }), 11000);
  kart.advancePosition(600, 1000, presentation);
  expect(kart.visualPosition).toBe(1006);
  kart.advancePosition(1200, 1000, presentation);
  expect(kart.visualPosition).toBe(1006);
  expect(kart.authoritativePosition).toBe(1000);
  expect(kart.status).toBe("FINISHED");
  expect(kart.finishedAtEpochMs).toBe(9999);
  kart.reset();
  expect(kart.finishReleased).toBe(false);
  expect(kart.finishRunout).toBeNull();
});

it("seeds at the checkpoint-aged position, bounds prediction by the shared limit and keeps an old checkpoint", async () => {
  const kart = await kartAt(100, { movementUnitsPerSecond: 6, positionAtEpochMs: 9000 });
  expect(kart.visualPosition).toBe(106);
  kart.advancePosition(1000, 1000);
  expect(kart.targetPosition).toBeCloseTo(112, 6);
  kart.applySnapshot(raceOpponent({ position: 100, positionAtEpochMs: 9000, movementUnitsPerSecond: 6 }), 11500);
  expect(kart.targetPosition).toBeCloseTo(115, 6);
  kart.advancePosition(1000, 1000);
  expect(kart.targetPosition).toBeCloseTo(121, 6);
  kart.applySnapshot(raceOpponent({ position: 100, positionAtEpochMs: 9000, movementUnitsPerSecond: 6 }), 11000);
  expect(kart.targetPosition).toBeCloseTo(121, 6);
  kart.advancePosition(10000, 1000);
  expect(kart.targetPosition).toBeCloseTo(100 + 6 * STUDENT_RACE_ANIMATION_CONFIG.motion.predictionLimitMs / 1000, 6);
  expect(kart.authoritativePosition).toBe(100);
});

it.each(["DISCONNECTED", "FINISHED", "WAITING"])("never predicts forward for %s", async (status) => {
  const kart = await kartAt(100, { status, movementUnitsPerSecond: 6 });
  kart.advancePosition(5000, 1000);
  expect(kart.targetPosition).toBe(100);
});

it("smooths answer bonuses, caps prediction and never reverses a visible kart", async () => {
  const kart = await kartAt(100);
  kart.applySnapshot(raceOpponent({ position: 120, movementUnitsPerSecond: 0 }), 10000);
  let previous = kart.visualPosition;
  for (let frame = 0; frame < 1000; frame += 1) {
    kart.advancePosition(16, 1000);
    expect(kart.visualPosition - previous).toBeLessThan(0.6);
    expect(kart.visualPosition).toBeGreaterThanOrEqual(previous);
    previous = kart.visualPosition;
  }
  expect(kart.visualPosition).toBeGreaterThan(119);
  kart.applySnapshot(raceOpponent({ position: 110, movementUnitsPerSecond: 0 }), 10000);
  kart.advancePosition(16, 1000);
  expect(kart.visualPosition).toBe(previous);
  kart.applySnapshot(raceOpponent({ position: 998, movementUnitsPerSecond: 6 }), 10000);
  kart.advancePosition(2500, 1000);
  expect(kart.targetPosition).toBe(1000);
  expect(kart.visualPosition).toBeLessThan(125);
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

it.each([[360, 740], [390, 844], [1440, 1040], [1024, 600]])(
  "shows two parallel players reciprocally with real art at %sx%s", async (width, height) => {
    const viewers = [];
    for (const [selfLane, otherLane] of [[1, 2], [2, 1]]) {
      const frame = opponentFrame({ width, height, position: 200, lane: selfLane, deltaMs: 200 });
      const player = new PlayerKartLayer(new Container(), { loadVehicleAssets: realArtVehicle });
      player.setVehicleAssetKey("TOY_CAR_GREEN");
      const other = await kartAt(200, { laneNumber: otherLane, vehicleAssetKey: "TOY_CAR_RED" }, realArtVehicle);
      await Promise.resolve();
      player.update(frame);
      other.update(frame);
      viewers.push({ frame, player, other, selfLane });
    }
    for (const { frame, player, other, selfLane } of viewers) {
      expect(other.projected.visible).toBe(true);
      expect(other.projected.y).toBeCloseTo(frame.playerGroundY, 6);
      expect(other.visibilityState).not.toBe(STATES.HIDDEN);
      expect(other.drawIntersects).toBe(true);
      expect(Math.sign(other.projected.x - frame.perspective.centerX)).toBe(selfLane === 1 ? 1 : -1);
      const ownBounds = boundsBox(player.getBounds());
      const otherBounds = boundsBox(other.vehicleVisual.getBounds());
      expect(otherBounds.maxX - otherBounds.minX).toBeCloseTo(ownBounds.maxX - ownBounds.minX, 6);
      expect(coveredRatio(otherBounds, ownBounds)).toBeLessThan(0.35);
      expect(otherBounds.minX).toBeGreaterThanOrEqual(-1);
      expect(otherBounds.maxX).toBeLessThanOrEqual(width + 1);
      player.destroy();
    }
    expect(viewers[0].other.projected.x - viewers[0].frame.perspective.centerX)
      .toBeCloseTo(-(viewers[1].other.projected.x - viewers[1].frame.perspective.centerX), 6);
  });

it("mirrors the longitudinal difference when viewer and subject swap", async () => {
  const seenByLeader = await kartAt(198, { laneNumber: 2 });
  const seenByTrailer = await kartAt(200, { laneNumber: 1 });
  const leaderFrame = opponentFrame({ position: 200, lane: 1 });
  const trailerFrame = opponentFrame({ position: 198, lane: 2 });
  seenByLeader.update(leaderFrame);
  seenByTrailer.update(trailerFrame);
  const leaderView = seenByLeader.relativeDistance - leaderFrame.playerReferenceDistance;
  const trailerView = seenByTrailer.relativeDistance - trailerFrame.playerReferenceDistance;
  expect(leaderView).toBeCloseTo(-2, 9);
  expect(trailerView).toBeCloseTo(2, 9);
  expect(seenByLeader.projected.y).toBeGreaterThan(leaderFrame.playerGroundY);
  expect(seenByTrailer.projected.y).toBeLessThan(trailerFrame.playerGroundY);
});

it("stays drawable from ahead through alongside to behind and exits only past the camera", async () => {
  const kart = await kartAt(230, { laneNumber: 5 }, realArtVehicle);
  await Promise.resolve();
  const reference = opponentFrame({ position: 230, lane: 4 });
  const stages = [200, 229, 230, 230.8].map((own) => {
    kart.update(opponentFrame({ position: own, lane: 4, deltaMs: 200 }));
    return { own, y: kart.projected.y, state: kart.visibilityState, visible: kart.projected.visible };
  });
  expect(stages.every((stage) => stage.visible && stage.state !== STATES.HIDDEN)).toBe(true);
  expect(stages[0].y).toBeLessThan(reference.playerGroundY);
  expect(stages[1].y).toBeLessThan(reference.playerGroundY);
  expect(stages[2].y).toBeCloseTo(reference.playerGroundY, 6);
  expect(stages[3].y).toBeGreaterThan(reference.playerGroundY);
  let own = 230.8;
  while (kart.visibilityState === STATES.VISIBLE && own < 240) {
    own += 0.1;
    kart.update(opponentFrame({ position: own, lane: 4, deltaMs: 16 }));
  }
  expect(kart.visibilityState).toBe(STATES.EXITING);
  expect(own - 230).toBeGreaterThan(1.5);
  expect(own - 230).toBeLessThan(9);
  while (kart.visibilityState !== STATES.HIDDEN) kart.update(opponentFrame({ position: own, lane: 4, deltaMs: 200 }));
  expect(kart.releasable).toBe(true);
  kart.releasable = false;
  kart.update(opponentFrame({ position: 210, lane: 4, deltaMs: 16 }));
  expect(kart.visibilityState).toBe(STATES.ENTERING);
  expect(kart.visualPosition).toBe(230);
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

it("prepares rear entry behind the panel instead of waiting until the anchor crosses it", async () => {
  const frame = opponentFrame();
  const kart = await kartAt(frame.raceObjectCameraPosition - 0.5);
  kart.update(frame);
  expect(kart.projected.visible).toBe(true);
  expect(kart.projected.y).toBeGreaterThan(frame.layout.world.bottomY);
  expect(kart.visibilityState).toBe(STATES.ENTERING);
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

it("suppresses historical finishers and settles an observed finish immediately for reduced motion", async () => {
  const presentation = { ...STUDENT_RACE_FINISH_EXPERIENCE, active: true,
    releasedFinisherIdsSet: new Set([2]), runoutDurationMs: 1200 };
  const historical = await kartAt(1000, { status: "FINISHED" });
  const live = await kartAt(999);
  live.applySnapshot(raceOpponent({ position: 1000, status: "FINISHED" }), 11000);
  const frame = { ...opponentFrame({ position: 999 }), finishPresentation: presentation };
  frame.runtimeState.visual.reducedMotion = true;
  historical.update(frame);
  live.update(frame);
  expect(historical.finishRunout).toBeNull();
  expect(historical.vehicleVisual.root.visible).toBe(false);
  expect(live.visualPosition).toBe(1006);
  expect(live.authoritativePosition).toBe(1000);
});

it.each([[360, 640], [960, 1040]])("keeps all eight server lanes inside the road at %sx%s", async (width, height) => {
  for (const selfLane of [1, 4, 8]) {
    const frame = opponentFrame({ width, height, lane: selfLane, deltaMs: 200 });
    const karts = await Promise.all(Array.from({ length: 8 }, (_, index) => kartAt(200, { laneNumber: index + 1 })));
    let previousX = -Infinity;
    for (const kart of karts) {
      kart.update(frame);
      const bounds = kart.vehicleVisual.getBounds();
      const safeHalf = kart.projected.roadHalfWidth * 0.74;
      expect(bounds.minX).toBeGreaterThan(frame.perspective.centerX - safeHalf);
      expect(bounds.maxX).toBeLessThan(frame.perspective.centerX + safeHalf);
      expect(kart.projected.y).toBeCloseTo(frame.playerGroundY);
      expect(kart.projected.x).toBeGreaterThan(previousX);
      previousX = kart.projected.x;
    }
  }
});

it("keeps the adjacent lane at its full step regardless of roster width", async () => {
  const frame = opponentFrame({ width: 1440, height: 1040, lane: 1, deltaMs: 200 });
  const twoPlayerFrame = { ...frame, runtimeState: { ...frame.runtimeState, playerCount: 2 } };
  const eightPlayerFrame = { ...frame, runtimeState: { ...frame.runtimeState, playerCount: 8 } };
  const inPair = await kartAt(200, { laneNumber: 2 });
  const inField = await kartAt(200, { laneNumber: 2 });
  inPair.update(twoPlayerFrame);
  inField.update(eightPlayerFrame);
  expect(inField.projected.x).toBeCloseTo(inPair.projected.x, 9);
  expect(inPair.projected.x - frame.perspective.centerX).toBeCloseTo(frame.laneStepRatio * inPair.projected.roadHalfWidth, 6);
});

it("tracks hidden opponents through the preload band before a rear answer bonus enters view", async () => {
  const frame = opponentFrame();
  const kart = await kartAt(196);
  kart.update(frame);
  kart.applySnapshot(raceOpponent({ position: 216, movementUnitsPerSecond: 0 }), 11000);
  const start = kart.visualPosition;
  kart.update(frame);
  expect(kart.visualPosition - start).toBeLessThan(1);
  for (let index = 0; index < 1000; index += 1) kart.update(frame);
  expect(kart.visibilityState).toBe(STATES.VISIBLE);
  expect(kart.visualPosition).toBeGreaterThan(215);
});

it("uses the player's visual dynamics for a +20 bonus and rate change with fresh server checkpoints", async () => {
  const kart = await kartAt(300, { movementUnitsPerSecond: 4 });
  const player = createStudentRaceMotion();
  const state = (position, rate, stamp) => ({ totalDistance: 1000, lastSnapshotAtEpochMs: stamp, playerStatus: "RACING",
    player: { racePlayerId: 1, positionAtEpochMs: stamp },
    visual: { targetPosition: position, targetSpeed: rate / 4, movementUnitsPerSecond: rate } });
  player.updateRuntimeState(state(300, 4, 10000));
  let previous = 300;
  for (let index = 0; index < 1000; index += 1) {
    if (index % 50 === 0) {
      const stamp = 11000 + index * 16;
      const position = 320 + 5.6 * index * 16 / 1000;
      player.updateRuntimeState(state(position, 5.6, stamp));
      kart.applySnapshot(raceOpponent({ position, movementUnitsPerSecond: 5.6, positionAtEpochMs: stamp }), stamp);
      expect(kart.visualPosition).toBe(previous);
    }
    kart.advancePosition(16, 1000);
    expect(kart.visualPosition).toBeCloseTo(player.advance(16).position, 9);
    expect(kart.visualPosition).toBeGreaterThan(previous);
    expect(kart.visualPosition - previous).toBeLessThan(0.6);
    previous = kart.visualPosition;
  }
  expect(kart.visualPosition).toBeCloseTo(320 + 5.6 * 16, 0);
});

it("uses full projected dimensions for hidden rear and lateral preload", async () => {
  const kart = await kartAt(200);
  const frame = opponentFrame();
  const top = frame.layout.questionPanel.topY + 100;
  vi.spyOn(kart.vehicleVisual, "getBounds").mockReturnValue({ minX: -200, maxX: -50, minY: top, maxY: top + 200 });
  kart.update(frame);
  expect(kart.preloadMarginX).toBe(174);
  expect(kart.preloadMarginY).toBe(400);
  expect(kart.preloaded).toBe(true);
  expect(kart.canEnter).toBe(false);
  expect(kart.visibilityState).toBe(STATES.HIDDEN);
});
