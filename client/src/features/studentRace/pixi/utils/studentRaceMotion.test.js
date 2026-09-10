import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import { createStudentRaceMotion } from "./studentRaceMotion";
import { STUDENT_RACE_FINISH_EXPERIENCE } from "../../config/finishExperienceConfig.js";

const presentation = (released) => ({ ...STUDENT_RACE_FINISH_EXPERIENCE, active: true,
  ownCrossingReleased: released, runoutDurationMs: STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs });

function runtime({ position = 100, rate = 4, speed = 1, stamp = 1000, finished = false, raceId = 1 } = {}) {
  return {
    race: { id: raceId },
    lastSnapshotAtEpochMs: stamp,
    totalDistance: 1000,
    playerFinished: finished,
    visual: { targetPosition: position, targetSpeed: speed, movementUnitsPerSecond: rate },
  };
}

function runFrames(motion, durationMs, fps = 60) {
  const samples = [];
  for (let index = 0; index < Math.round(durationMs * fps / 1000); index += 1) {
    samples.push(motion.advance(1000 / fps));
  }
  return samples;
}

describe("student race visual motion", () => {
  it("waits for real race data before seeding the first visual position", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(createInitialRaceRuntimeState());
    expect(motion.advance(100).position).toBe(0);
    motion.updateRuntimeState(runtime({ position: 70 }));

    expect(motion.advance(0).position).toBe(70);
  });

  it("starts at a refreshed authoritative position without scrolling from zero", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime({ position: 800 }));

    expect(motion.advance(0)).toEqual({ position: 800, speed: 1 });
    expect(runFrames(motion, 1000).at(-1).position).toBeCloseTo(804, 8);
  });

  it("predicts steady motion at exactly the server rate across duplicate render updates", () => {
    const motion = createStudentRaceMotion();
    const state = runtime();
    motion.updateRuntimeState(state);
    runFrames(motion, 500);
    motion.updateRuntimeState({ ...state, visual: { ...state.visual, activeEffect: "correct" } });

    expect(runFrames(motion, 500).at(-1).position).toBeCloseTo(104, 8);
    expect(state.visual.targetPosition).toBe(100);
  });

  it.each([10, 15, 20])("smoothly reconciles a +%s position bonus with bounded visual velocity", (bonus) => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    motion.updateRuntimeState(runtime({ position: 100 + bonus, rate: 5.6, speed: 1.4, stamp: 2000 }));

    const samples = runFrames(motion, 16000);
    let previousPosition = 100;
    let peakRate = 0;
    samples.forEach(({ position }, index) => {
      const measuredRate = (position - previousPosition) * 60;
      peakRate = Math.max(peakRate, measuredRate);
      expect(position).toBeGreaterThanOrEqual(previousPosition);
      expect(position).toBeLessThanOrEqual(100 + bonus + 5.6 * (index + 1) / 60 + 0.000001);
      previousPosition = position;
    });
    expect(peakRate).toBeLessThan(12);
    expect(samples[0].position - 100).toBeLessThan(0.08);
    expect((samples[119].position - samples[118].position) * 60).toBeGreaterThan(6.6);
    expect((samples.at(-1).position - samples.at(-2).position) * 60).toBeCloseTo(5.6, 2);
    expect(samples.at(-1).position).toBeCloseTo(100 + bonus + 5.6 * 16, 2);
  });

  it("moderates the first easy answer's correction while retaining its higher rate after feedback ends", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime({ rate: 2, speed: 0.5 }));
    const answer = runtime({ position: 110, rate: 2.8, speed: 0.7, stamp: 2000 });
    motion.updateRuntimeState({ ...answer, visual: { ...answer.visual, activeEffect: "correct" } });
    const effectMs = STUDENT_RACE_ANIMATION_CONFIG.effects.boostEffectDurationMs;
    const duringFeedback = runFrames(motion, effectMs);
    motion.updateRuntimeState({ ...answer, visual: { ...answer.visual, activeEffect: null } });
    expect(motion.advance(0).position).toBe(duringFeedback.at(-1).position);
    const samples = [...duringFeedback, ...runFrames(motion, 20000 - effectMs)];
    let previousPosition = 100;
    let peakRate = 0;

    samples.forEach(({ position }) => {
      const measuredRate = (position - previousPosition) * 60;
      peakRate = Math.max(peakRate, measuredRate);
      expect(measuredRate).toBeGreaterThanOrEqual(2);
      previousPosition = position;
    });

    expect(peakRate).toBeLessThan(5.6);
    expect((samples[299].position - samples[298].position) * 60).toBeGreaterThan(3.4);
    expect((samples.at(-1).position - samples.at(-2).position) * 60).toBeCloseTo(2.8, 2);
    expect(samples.at(-1).speed).toBeCloseTo(0.7, 8);
    expect(samples.at(-1).position).toBeCloseTo(166, 2);
  });

  it("gradually accelerates the world itself to a sustained authoritative movement rate", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    motion.updateRuntimeState(runtime({ rate: 8, speed: 2, stamp: 2000 }));

    const samples = runFrames(motion, 16000);
    const firstRate = (samples[0].position - 100) * 60;
    const halfSecondRate = (samples[29].position - samples[28].position) * 60;
    const finalRate = (samples.at(-1).position - samples.at(-2).position) * 60;

    expect(firstRate).toBeGreaterThan(4);
    expect(firstRate).toBeLessThan(4.3);
    expect(halfSecondRate).toBeGreaterThan(firstRate + 2);
    expect(finalRate).toBeCloseTo(8, 2);
    expect(samples.at(-1).speed).toBeCloseTo(2, 8);
    expect(samples.at(-1).position).toBeCloseTo(228, 2);
  });

  it("retains velocity across fresh polling snapshots during an answer acceleration", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    motion.updateRuntimeState(runtime({ position: 120, rate: 5.6, speed: 1.4, stamp: 2000 }));
    const before = runFrames(motion, 500);
    const previousRate = (before.at(-1).position - before.at(-2).position) * 60;
    motion.updateRuntimeState(runtime({ position: 122.8, rate: 5.6, speed: 1.4, stamp: 2500 }));

    expect(motion.advance(0).position).toBe(before.at(-1).position);
    const after = motion.advance(1000 / 60);
    const nextRate = (after.position - before.at(-1).position) * 60;
    expect(Math.abs(nextRate - previousRate)).toBeLessThan(0.3);
  });

  it("keeps reconciliation consistent at 30, 60 and 120 frames per second", () => {
    const positions = [30, 60, 120].map((fps) => {
      const motion = createStudentRaceMotion();
      motion.updateRuntimeState(runtime());
      let authoritativePosition = 100;
      let rate = 4;
      for (let answer = 1; answer <= 8; answer += 1) {
        runFrames(motion, 900, fps);
        authoritativePosition += rate * 0.9 + 20;
        rate = Math.min(8, rate + 1.6);
        motion.updateRuntimeState(runtime({ position: authoritativePosition, stamp: 1000 + answer * 900, rate }));
      }
      return runFrames(motion, 1000, fps).at(-1).position;
    });

    expect(positions[0]).toBeCloseTo(positions[1], 8);
    expect(positions[1]).toBeCloseTo(positions[2], 8);
  });

  it("keeps consecutive bonuses bounded without accumulating a growing camera delay", () => {
    const motion = createStudentRaceMotion();
    let authoritativePosition = 100;
    let rate = 4.8;
    let previousPosition = 100;
    motion.updateRuntimeState(runtime({ position: authoritativePosition, rate }));

    const backlogs = [];
    for (let answer = 1; answer <= 20; answer += 1) {
      runFrames(motion, 900).forEach(({ position }) => {
        expect((position - previousPosition) * 60).toBeLessThanOrEqual(32.000001);
        expect(position).toBeGreaterThanOrEqual(previousPosition);
        previousPosition = position;
      });
      authoritativePosition += rate * 0.9 + 20;
      rate = Math.min(8, rate + 1.6);
      motion.updateRuntimeState(runtime({ position: authoritativePosition, rate, stamp: answer + 1000 }));
      expect(motion.advance(0).position).toBe(previousPosition);
      backlogs.push(authoritativePosition - previousPosition);
      expect(backlogs.at(-1)).toBeLessThan(75);
    }
    expect(backlogs.at(-1) - backlogs.at(-5)).toBeLessThan(1);
  });

  it("accepts equal-timestamp position updates without restarting from older truth", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    motion.updateRuntimeState(runtime({ position: 110 }));

    expect(runFrames(motion, 16000).at(-1).position).toBeCloseTo(174, 2);
  });

  it("absorbs different polling arrival delays without position jumps or renewed speed pulses", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    const receipts = new Map([[126, 2000], [255, 4000], [366, 6000], [489, 8000]]);
    let previousPosition = 100;

    for (let frame = 1; frame <= 600; frame += 1) {
      if (receipts.has(frame)) {
        const serverElapsed = receipts.get(frame);
        motion.updateRuntimeState(runtime({ position: 100 + 4 * serverElapsed / 1000, stamp: 1000 + serverElapsed }));
        expect(motion.advance(0).position).toBe(previousPosition);
      }
      const { position } = motion.advance(1000 / 60);
      const measuredRate = (position - previousPosition) * 60;
      expect(measuredRate).toBeGreaterThan(3.5);
      expect(measuredRate).toBeLessThan(4.5);
      previousPosition = position;
    }
  });

  it("keeps a stopped snapshot still without inferring game finish", () => {
    const motion = createStudentRaceMotion();
    const state = runtime({ rate: 0, speed: 0 });
    motion.updateRuntimeState(state);

    expect(runFrames(motion, 3000).at(-1)).toEqual({ position: 100, speed: 0 });
    expect(state.playerFinished).toBe(false);
  });

  it.each([0.1, 10])("settles a stopped server's +%s backlog without passing its final drawing position", (bonus) => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    motion.updateRuntimeState(runtime({ position: 100 + bonus, rate: 0, speed: 0, stamp: 2000 }));

    let previousPosition = 100;
    const samples = runFrames(motion, 16000);
    samples.forEach(({ position }) => {
      expect(position).toBeGreaterThanOrEqual(previousPosition);
      expect(position).toBeLessThanOrEqual(100 + bonus);
      previousPosition = position;
    });
    expect(samples.at(-1).position).toBeCloseTo(100 + bonus, 2);
    expect(samples.at(-1).speed).toBeCloseTo(0, 8);
  });

  it("holds a stopped world that is already ahead without scrolling backward", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    runFrames(motion, 1000);
    motion.updateRuntimeState(runtime({ position: 103, rate: 0, speed: 0, stamp: 2000 }));

    expect(runFrames(motion, 3000).at(-1).position).toBeCloseTo(104, 8);
  });

  it("does not replay an unchanged snapshot when presentation props update after a long prediction", () => {
    const motion = createStudentRaceMotion();
    const state = runtime();
    motion.updateRuntimeState(state);
    runFrames(motion, 40000);
    motion.updateRuntimeState({ ...state });

    expect(motion.advance(0).position).toBeCloseTo(260, 8);
  });

  it("limits a resumed long frame and seeds a snapshot beyond the old visible window", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime({ rate: 8 }));

    expect(motion.advance(10000).position).toBeCloseTo(100.8, 8);
    motion.updateRuntimeState(runtime({ position: 400, stamp: 2000 }));
    expect(motion.advance(0).position).toBe(400);
  });

  it("never scrolls backward for a small prediction correction", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime());
    runFrames(motion, 1000);
    motion.updateRuntimeState(runtime({ position: 103, stamp: 2000 }));

    let previousPosition = 104;
    runFrames(motion, 1000).forEach(({ position }) => {
      expect(position).toBeGreaterThanOrEqual(previousPosition - 0.000001);
      previousPosition = position;
    });
  });

  it("smoothly follows an authoritative slowdown and delayed position without reversing", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime({ rate: 8, speed: 2 }));
    runFrames(motion, 1000);
    motion.updateRuntimeState(runtime({ position: 106, rate: 6.4, speed: 1.6, stamp: 2000 }));
    let previousPosition = 108;
    const samples = runFrames(motion, 16000);

    samples.forEach(({ position }) => {
      expect(position).toBeGreaterThanOrEqual(previousPosition);
      previousPosition = position;
    });

    expect((samples[0].position - 108) * 60).toBeGreaterThan(7.8);
    expect((samples.at(-1).position - samples.at(-2).position) * 60).toBeCloseTo(6.4, 2);
    expect(samples.at(-1).position).toBeCloseTo(106 + 6.4 * 16, 2);
  });

  it("resets directly on a dev loop wrap or a different race", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime({ position: 995 }));
    motion.updateRuntimeState(runtime({ position: 2, stamp: 2000 }));
    expect(motion.advance(0).position).toBe(2);

    motion.updateRuntimeState(runtime({ position: 40, stamp: 3000, raceId: 2 }));
    expect(motion.advance(0).position).toBe(40);
    motion.updateFinishPresentation(presentation(true));
    motion.advance(1200);
    motion.updateRuntimeState({ ...runtime({ position: 990, stamp: 4000, raceId: 2 }), player: { racePlayerId: 22 } });
    motion.updateFinishPresentation(presentation(false));
    expect(motion.advance(0).position).toBe(990);
    expect(runFrames(motion, 10000).every((frame) => frame.position <= 999.85)).toBe(true);
  });

  it("settles a final bonus during the finish moment and remains stopped", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime({ position: 980 }));
    const finished = runtime({ position: 1000, rate: 0, speed: 0, finished: true, stamp: 2000 });
    motion.updateRuntimeState(finished);
    motion.updateFinishPresentation(presentation(true));
    runFrames(motion, 500);
    motion.updateRuntimeState({ ...finished, lastSnapshotAtEpochMs: 3000 });
    const samples = runFrames(motion, STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs - 500);

    expect(samples.at(-1).position).toBe(1006);
    expect(runFrames(motion, 2000).at(-1).position).toBe(1006);
    expect(finished.playerFinished).toBe(true);
  });

  it("completes a forty-unit final backlog within the existing presentation hold", () => {
    const motion = createStudentRaceMotion();
    const holdMs = STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;
    motion.updateRuntimeState(runtime({ position: 960 }));
    motion.updateRuntimeState(runtime({ position: 1000, rate: 0, speed: 0, finished: true, stamp: 2000 }));
    motion.updateFinishPresentation(presentation(true));

    const first = motion.advance(1000 / 60).position;
    expect(first - 960).toBeLessThan(0.1);
    expect(runFrames(motion, holdMs - 1000 / 60).at(-1).position).toBe(1006);
    expect(motion.advance(100).position).toBe(1006);
  });

  it("finishes accumulated consecutive bonuses before the canvas hold expires", () => {
    const motion = createStudentRaceMotion();
    let authoritativePosition = 820;
    motion.updateRuntimeState(runtime({ position: authoritativePosition, rate: 8 }));
    for (let answer = 1; answer <= 7; answer += 1) {
      runFrames(motion, 600);
      authoritativePosition += 8 * 0.6 + 20;
      motion.updateRuntimeState(runtime({ position: authoritativePosition, rate: 8, stamp: answer + 1000 }));
    }
    expect(1000 - motion.advance(0).position).toBeGreaterThan(40);
    motion.updateRuntimeState(runtime({ position: 1000, rate: 0, speed: 0, finished: true, stamp: 2000 }));
    motion.updateFinishPresentation(presentation(true));

    const holdMs = STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;
    expect(runFrames(motion, holdMs).at(-1).position).toBe(1006);
  });

  it("uses elapsed time for the finish even when a frame exceeds the normal prediction cap", () => {
    const motion = createStudentRaceMotion();
    motion.updateRuntimeState(runtime({ position: 960 }));
    const finished = runtime({ position: 1000, rate: 0, speed: 0, finished: true, stamp: 2000 });
    motion.updateRuntimeState(finished);
    motion.updateFinishPresentation(presentation(true));
    motion.advance(600);
    motion.updateRuntimeState({ ...finished, lastSnapshotAtEpochMs: 3000 });

    const holdMs = STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;
    expect(motion.advance(holdMs - 600).position).toBe(1006);
  });

  it("caps drawing at totalDistance without declaring a finish", () => {
    const motion = createStudentRaceMotion();
    const state = runtime({ position: 999, rate: 8 });
    motion.updateRuntimeState(state);

    expect(runFrames(motion, 1000).at(-1).position).toBe(1000);
    expect(state.playerFinished).toBe(false);
  });

  it("holds before proof despite a finished snapshot and never starts runout on direct finished bootstrap", () => {
    const motion = createStudentRaceMotion();
    const truth = runtime({ position: 1000, finished: true, rate: 0 });
    motion.updateRuntimeState(truth);
    expect(runFrames(motion, 2000).at(-1).position).toBe(1000);
    motion.updateFinishPresentation(presentation(false));
    expect(runFrames(motion, 2000).every((frame) => frame.position <= 999.85)).toBe(true);
    expect(truth.visual.targetPosition).toBe(1000);
    motion.updateFinishPresentation(presentation(true));
    expect(runFrames(motion, 1200).at(-1).position).toBe(1006);
    expect(truth.visual.targetPosition).toBe(1000);
  });

  it("aligns crossing time for tied racers despite different visual backlogs", () => {
    const racers = [960, 999.85].map((position) => {
      const motion = createStudentRaceMotion();
      motion.updateRuntimeState(runtime({ position }));
      motion.updateFinishPresentation(presentation(true));
      return motion;
    });
    for (const racer of racers) {
      expect(racer.advance(599).position).toBeLessThan(1000);
      expect(racer.advance(1).position).toBe(1000);
      expect(racer.advance(1).position).toBeGreaterThan(1000);
    }
  });
});
