import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLocalStudentRaceRuntime } from "./localStudentRaceRuntime";
import { mapLocalRuntimeSnapshotToState } from "./mapLocalRuntimeSnapshotToState";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("student race motion preview", () => {
  it("supplies the real movement-rate fixture and a fresh identity on every snapshot", () => {
    const runtime = createLocalStudentRaceRuntime({ scenario: null });
    const initial = runtime.getSnapshot();
    runtime.start();
    vi.advanceTimersByTime(1000);
    const current = runtime.getSnapshot();
    runtime.stop();

    expect(current.position).toBeCloseTo(4.8);
    expect(current.movementUnitsPerSecond).toBeCloseTo(4.8);
    expect(current.snapshotAtEpochMs - initial.snapshotAtEpochMs).toBe(1000);
  });

  it("offers an explicit dev boost scenario with a real-sized bonus", () => {
    const runtime = createLocalStudentRaceRuntime({ scenario: "boost" });
    expect(runtime.getSnapshot().speed).toBe(0.5);
    expect(runtime.getSnapshot().movementUnitsPerSecond).toBe(2);
    runtime.start();
    vi.advanceTimersByTime(5000);
    const current = runtime.getSnapshot();
    runtime.stop();

    expect(current.position).toBeCloseTo(20);
    expect(current.speed).toBeCloseTo(0.7);
    expect(current.movementUnitsPerSecond).toBeCloseTo(2.8);
  });

  it("sustains the boosted rate beyond thirty seconds without repeating the position bonus", () => {
    const runtime = createLocalStudentRaceRuntime({ scenario: "boost" });
    runtime.start();
    vi.advanceTimersByTime(5000);
    let previousPosition = runtime.getSnapshot().position;
    const samples = [];
    const unsubscribe = runtime.subscribe((snapshot) => {
      samples.push(snapshot);
      expect(snapshot.position - previousPosition).toBeCloseTo(1.4);
      expect(snapshot.speed).toBeCloseTo(0.7);
      expect(snapshot.movementUnitsPerSecond).toBeCloseTo(2.8);
      previousPosition = snapshot.position;
    });

    vi.advanceTimersByTime(25000);
    expect(runtime.getSnapshot().position).toBeCloseTo(90);
    vi.advanceTimersByTime(5000);
    expect(runtime.getSnapshot().position).toBeCloseTo(104);
    expect(samples).toHaveLength(60);
    unsubscribe();
    runtime.stop();
  });

  it("maps prediction fields while preserving question and server-owned gameplay data", () => {
    const previous = {
      question: { id: 3 },
      player: { score: 20, streak: 2 },
      visual: { activeEffect: null },
    };
    const runtime = createLocalStudentRaceRuntime({ scenario: null });
    const snapshot = runtime.getSnapshot();
    const state = mapLocalRuntimeSnapshotToState(previous, snapshot);

    expect(state.visual.movementUnitsPerSecond).toBe(snapshot.movementUnitsPerSecond);
    expect(state.lastSnapshotAtEpochMs).toBe(snapshot.snapshotAtEpochMs);
    expect(state.question).toBe(previous.question);
    expect(state.player.score).toBe(20);
    expect(state.player.streak).toBe(2);
  });

  it("reaches the finish preview without wrapping the gate back to the start", () => {
    const runtime = createLocalStudentRaceRuntime({ scenario: "finish" });
    expect(runtime.getSnapshot().position).toBe(900);
    runtime.start();
    vi.advanceTimersByTime(25000);
    const snapshot = runtime.getSnapshot();
    runtime.stop();

    expect(snapshot.position).toBe(snapshot.totalDistance);
    expect(snapshot.playerFinished).toBe(true);
    expect(snapshot.movementUnitsPerSecond).toBe(0);
    expect(mapLocalRuntimeSnapshotToState({ player: {}, visual: {} }, snapshot).playerFinished).toBe(true);
  });
});
