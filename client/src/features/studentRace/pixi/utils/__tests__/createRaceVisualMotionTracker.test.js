import { Container } from "pixi.js";
import { afterEach, describe, expect, it } from "vitest";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig.js";
import { raceOpponent } from "../../../runtime/studentRaceTestFixtures.js";
import { OpponentKart } from "../../opponents/OpponentKart.js";
import { fallbackVehicle } from "../../opponents/opponentTestFixtures.js";
import { createRaceVisualMotionTracker, normalizeMotionAuthority } from "../createRaceVisualMotionTracker.js";
import { createStudentRaceMotion } from "../studentRaceMotion.js";

const LIMIT_MS = STUDENT_RACE_ANIMATION_CONFIG.motion.predictionLimitMs;
const allocated = [];
afterEach(() => { allocated.splice(0).forEach((kart) => kart.destroy()); });

function opponentKart() {
  const kart = new OpponentKart(new Container(), { loadVehicleAssets: fallbackVehicle });
  allocated.push(kart);
  return kart;
}

function localState({ position, rate, stamp, positionAt = stamp, status = "RACING", raceId = 1 }) {
  return { race: { id: raceId }, player: { racePlayerId: 1, positionAtEpochMs: positionAt }, playerStatus: status,
    lastSnapshotAtEpochMs: stamp, totalDistance: 1000,
    visual: { targetPosition: position, targetSpeed: rate / 4, movementUnitsPerSecond: rate } };
}

describe("normalizeMotionAuthority", () => {
  it("credits the checkpoint age up to the shared limit and only for predictable racing samples", () => {
    const aged = normalizeMotionAuthority({ position: 96, positionAtEpochMs: 9000, movementRate: 4, canPredict: true }, 10000);
    expect(aged).toMatchObject({ position: 96, movementRate: 4, predictionAgeMs: 1000, maxPredictionMs: LIMIT_MS });
    expect(normalizeMotionAuthority({ position: 96, positionAtEpochMs: 1000, movementRate: 4, canPredict: true }, 10000).predictionAgeMs).toBe(LIMIT_MS);
    expect(normalizeMotionAuthority({ position: 96, positionAtEpochMs: 9000, movementRate: 4, canPredict: false }, 10000).movementRate).toBe(0);
    const anchorless = normalizeMotionAuthority({ position: 96, positionAtEpochMs: null, movementRate: 4, canPredict: true }, 10000);
    expect(anchorless).toMatchObject({ movementRate: 0, predictionAgeMs: 0 });
    expect(anchorless.snapshotKey).not.toBe(aged.snapshotKey);
    expect(normalizeMotionAuthority({ position: 96, positionAtEpochMs: 9000, movementRate: 4, canPredict: true }, 10500).snapshotKey)
      .toBe(aged.snapshotKey);
  });
});

describe("shared motion authority", () => {
  it("seeds different anchors of the same current position without an invented gap", () => {
    const alpha = createRaceVisualMotionTracker();
    const beta = createRaceVisualMotionTracker();
    alpha.seed(normalizeMotionAuthority({ position: 100, positionAtEpochMs: 10000, movementRate: 4, canPredict: true }, 10000));
    beta.seed(normalizeMotionAuthority({ position: 96, positionAtEpochMs: 9000, movementRate: 4, canPredict: true }, 10000));

    expect(alpha.position()).toBe(100);
    expect(beta.position()).toBe(100);
    for (let frame = 0; frame < 120; frame += 1) {
      expect(alpha.advance(1000 / 60).position).toBeCloseTo(beta.advance(1000 / 60).position, 9);
    }
    expect(alpha.position()).toBeCloseTo(108, 6);
  });

  it("keeps the elapsed prediction age on duplicate checkpoints instead of renewing the horizon", () => {
    const tracker = createRaceVisualMotionTracker();
    const sample = { position: 100, positionAtEpochMs: 9000, movementRate: 6, canPredict: true };
    tracker.seed(normalizeMotionAuthority(sample, 10000));
    tracker.advance(3000);
    expect(tracker.predictionAgeMs()).toBeCloseTo(4000, 6);
    tracker.updateAuthority(normalizeMotionAuthority(sample, 11000));
    expect(tracker.predictionAgeMs()).toBeCloseTo(4000, 6);
    expect(tracker.targetPosition()).toBeCloseTo(124, 6);
    tracker.updateAuthority(normalizeMotionAuthority(sample, 15000));
    expect(tracker.predictionAgeMs()).toBe(LIMIT_MS);
    expect(tracker.targetPosition()).toBeCloseTo(130, 6);
    tracker.advance(3000);
    expect(tracker.targetPosition()).toBeCloseTo(130, 6);
  });

  it("drives the same participant identically through the local and remote wrappers", () => {
    const local = createStudentRaceMotion();
    const remote = opponentKart();
    const samples = [
      { position: 300, rate: 4, stamp: 10000, positionAt: 10000 },
      { position: 300, rate: 4, stamp: 11000, positionAt: 10000 },
      { position: 320, rate: 5.6, stamp: 12000, positionAt: 12000 },
      { position: 320, rate: 5.6, stamp: 12500, positionAt: 12000 },
      { position: 331.2, rate: 5.6, stamp: 14000, positionAt: 14000 },
    ];
    let elapsed = 0;
    for (const sample of samples) {
      local.updateRuntimeState(localState(sample));
      remote.applySnapshot(raceOpponent({ position: sample.position, movementUnitsPerSecond: sample.rate,
        positionAtEpochMs: sample.positionAt }), sample.stamp, 1000);
      expect(local.advance(0).position).toBeCloseTo(remote.visualPosition, 9);
      for (let frame = 0; frame < 60; frame += 1) {
        elapsed += 16;
        remote.advancePosition(16, 1000);
        expect(local.advance(16).position).toBeCloseTo(remote.visualPosition, 9);
      }
    }
    expect(elapsed).toBe(4800);
  });

  it("converges both viewers onto one ordering after a staggered +20 bonus delivery", () => {
    const seenByOwner = createStudentRaceMotion();
    const seenByOpponent = opponentKart();
    seenByOwner.updateRuntimeState(localState({ position: 300, rate: 4, stamp: 10000 }));
    seenByOpponent.applySnapshot(raceOpponent({ position: 300, movementUnitsPerSecond: 4, positionAtEpochMs: 10000 }), 10000, 1000);
    const bonus = { position: 324, rate: 5.6, stamp: 11000 };
    seenByOwner.updateRuntimeState(localState(bonus));
    let ownerPosition = 300;
    let opponentPosition = 300;
    let lag = 0;
    let lagAfterFiveSeconds = null;
    let convergedAfterMs = null;
    for (let elapsed = 16; elapsed <= 16000; elapsed += 16) {
      if (elapsed === 2000) {
        seenByOpponent.applySnapshot(raceOpponent({ position: 324 + 5.6 * 2, movementUnitsPerSecond: 5.6,
          positionAtEpochMs: 13000 }), 13000, 1000);
      }
      if (elapsed % 2000 === 0 && elapsed >= 4000) {
        const stamp = 11000 + elapsed;
        const position = 324 + 5.6 * elapsed / 1000;
        seenByOwner.updateRuntimeState(localState({ position, rate: 5.6, stamp }));
        seenByOpponent.applySnapshot(raceOpponent({ position, movementUnitsPerSecond: 5.6, positionAtEpochMs: stamp }), stamp, 1000);
      }
      const nextOwner = seenByOwner.advance(16).position;
      seenByOpponent.advancePosition(16, 1000);
      expect(nextOwner).toBeGreaterThanOrEqual(ownerPosition);
      expect(seenByOpponent.visualPosition).toBeGreaterThanOrEqual(opponentPosition);
      ownerPosition = nextOwner;
      opponentPosition = seenByOpponent.visualPosition;
      lag = Math.max(lag, elapsed >= 2000 ? ownerPosition - opponentPosition : 0);
      if (elapsed === 7008) lagAfterFiveSeconds = Math.abs(ownerPosition - opponentPosition);
      if (elapsed >= 2000 && convergedAfterMs == null && Math.abs(ownerPosition - opponentPosition) < 0.5) {
        convergedAfterMs = elapsed - 2000;
      }
    }
    expect(convergedAfterMs).not.toBeNull();
    expect(convergedAfterMs).toBeLessThan(9000);
    expect(lagAfterFiveSeconds).toBeLessThan(5);
    expect(lag).toBeLessThan(21);
    expect(Math.abs(ownerPosition - opponentPosition)).toBeLessThan(0.05);
  });

  it("stops predicting after the shared limit without snapshots and resumes smoothly", () => {
    const local = createStudentRaceMotion();
    local.updateRuntimeState(localState({ position: 100, rate: 4, stamp: 1000 }));
    let previous = 100;
    for (let frame = 0; frame < 480; frame += 1) {
      const { position } = local.advance(1000 / 60);
      expect(position).toBeGreaterThanOrEqual(previous);
      previous = position;
    }
    expect(previous).toBeLessThan(120.1);
    expect(previous).toBeGreaterThan(119.5);
    local.updateRuntimeState(localState({ position: 132, rate: 4, stamp: 9000 }));
    for (let frame = 0; frame < 240; frame += 1) {
      const { position } = local.advance(1000 / 60);
      expect((position - previous) * 60).toBeLessThan(STUDENT_RACE_ANIMATION_CONFIG.motion.maxCorrectionUnitsPerSecond + 4.5);
      expect(position).toBeGreaterThanOrEqual(previous);
      previous = position;
    }
    expect(previous).toBeGreaterThan(140);
  });
});
