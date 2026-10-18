import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { createRaceVisualMotionTracker, normalizeMotionAuthority } from "../createRaceVisualMotionTracker";
import { createStudentRaceMotion } from "../studentRaceMotion";

const MOTION = STUDENT_RACE_ANIMATION_CONFIG.motion;

function runtime({ position = 100, rate = 4, stamp = 1000 } = {}) {
  return {
    race: { id: 1 },
    player: { racePlayerId: 11, positionAtEpochMs: stamp },
    playerStatus: "RACING",
    lastSnapshotAtEpochMs: stamp,
    totalDistance: 1000,
    playerFinished: false,
    visual: { targetPosition: position, targetSpeed: 1, movementUnitsPerSecond: rate },
  };
}

// Seeds at 100, then the server grants +80 (a Turbo success) in the next snapshot.
function afterTurboJump() {
  const motion = createStudentRaceMotion();
  motion.updateRuntimeState(runtime());
  for (let i = 0; i < 30; i += 1) motion.advance(1000 / 60);
  motion.updateRuntimeState(runtime({ position: 182, stamp: 1500 }));
  return motion;
}

function positionAfter(motion, ms) {
  let position = 0;
  for (let i = 0; i < Math.round((ms * 60) / 1000); i += 1) position = motion.advance(1000 / 60).position;
  return position;
}

describe("studentRaceMotion server progress reward", () => {
  it("absorbs +80 gradually with the normal correction cap and no launch acceleration", () => {
    const motion = afterTurboJump();
    let previous = motion.advance(0).position;
    const start = previous;
    let maxRate = 0;
    for (let i = 0; i < 180; i += 1) {
      const next = motion.advance(1000 / 60).position;
      maxRate = Math.max(maxRate, (next - previous) * 60);
      previous = next;
    }
    expect(maxRate).toBeLessThanOrEqual(4 + MOTION.maxCorrectionUnitsPerSecond + 0.01);
    expect(previous - start).toBeLessThan(75);
    expect(previous - start).toBeGreaterThan(30);
  });

  it("never runs past the server's position", () => {
    const motion = afterTurboJump();
    let maxLead = -Infinity;
    for (let i = 0; i < 240; i += 1) {
      const { position } = motion.advance(1000 / 60);
      const authority = 182 + 4 * ((i + 1) / 60) + 2;
      maxLead = Math.max(maxLead, position - authority);
    }

    expect(maxLead).toBeLessThan(1);
  });

  it.each([[4, 80], [2, 140], [8, 40]])(
    "stays behind the server's own target while absorbing a progress reward (speed %s, jump %s)",
    (rate, jump) => {
      const tracker = createRaceVisualMotionTracker();
      const authority = (position, stamp) => normalizeMotionAuthority(
        { position, positionAtEpochMs: stamp, movementRate: rate, canPredict: true }, stamp);
      tracker.seed(authority(100, 1000));
      for (let i = 0; i < 30; i += 1) tracker.advance(1000 / 60);
      tracker.updateAuthority(authority(100 + rate / 2 + jump, 1500));

      let maxLead = -Infinity;
      for (let i = 0; i < 300; i += 1) {
        tracker.advance(1000 / 60);
        maxLead = Math.max(maxLead, tracker.position() - tracker.targetPosition());
      }

      expect(maxLead).toBeLessThan(0.05);
    },
  );

  it("converges to a stopped server target without inventing further progress", () => {
    const motion = afterTurboJump();
    motion.updateRuntimeState(runtime({ position: 182, rate: 0, stamp: 2000 }));
    expect(positionAfter(motion, 25000)).toBeCloseTo(182, 1);
    expect(positionAfter(motion, 5000)).toBeLessThanOrEqual(182);
  });
});
