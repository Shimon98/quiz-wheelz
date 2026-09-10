import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import useStudentRaceFinishExperience from "./useStudentRaceFinishExperience.js";
import { mapRaceStateToRuntime } from "../runtime/mapRaceStateToRuntime.js";
import { raceResponse, raceOpponent } from "../runtime/studentRaceTestFixtures.js";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const advance = async (ms = 0) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const proof = (...entries) => ({ confirmedFinishers: entries.map(([racePlayerId, finishedAtEpochMs]) =>
  ({ racePlayerId, finishedAtEpochMs })) });
const runtime = (snapshot = {}, metadata = {}) => mapRaceStateToRuntime(raceResponse(snapshot, metadata));
const finished = () => runtime({ position: 1000, movementUnitsPerSecond: 0, playerFinished: true,
  playerStatus: "FINISHED", playerFinishedAtEpochMs: 9999 });

function setup(overrides = {}) {
  let props = { runtimeState: runtime(), view: RACE_VIEWS.PLAYING, finishOrder: null,
    finishSyncEnabled: true, requestFinishArbitration: vi.fn().mockResolvedValue(null), ...overrides };
  const hook = renderHook((input) => useStudentRaceFinishExperience(input), { initialProps: props });
  return { ...hook, request: props.requestFinishArbitration,
    update: (next) => { props = { ...props, ...next }; hook.rerender(props); } };
}

it("retains a live finished screen until proof releases the player and its runout completes", async () => {
  const hook = setup();
  hook.update({ runtimeState: finished(), view: RACE_VIEWS.FINISHED });
  await advance(1000);
  expect(hook.result.current.keepRaceScreen).toBe(true);
  expect(hook.result.current.presentation.ownCrossingReleased).toBe(false);
  hook.update({ finishOrder: proof([1, 9999]) });
  await advance();
  expect(hook.result.current.presentation.ownCrossingReleased).toBe(true);
  await advance(1199);
  expect(hook.result.current.keepRaceScreen).toBe(true);
  await advance(1);
  expect(hook.result.current.keepRaceScreen).toBe(false);
  expect(hook.result.current.presentationComplete).toBe(true);
});

it("does not reconstruct crossing or request proof on a direct finished bootstrap", async () => {
  const hook = setup({ runtimeState: finished(), view: RACE_VIEWS.FINISHED, finishOrder: proof([1, 9999]) });
  await advance(5000);
  expect(hook.request).not.toHaveBeenCalled();
  expect(hook.result.current.keepRaceScreen).toBe(false);
  expect(hook.result.current.presentation.active).toBe(false);
  expect(hook.result.current.presentation.ownCrossingReleased).toBe(false);
});

it("starts at the ETA lead and replaces the old timer after an authoritative speed change", async () => {
  const hook = setup({ runtimeState: runtime({ position: 960, movementUnitsPerSecond: 4 }) });
  await advance(2000);
  expect(hook.request).not.toHaveBeenCalled();
  hook.update({ runtimeState: runtime({ position: 970, movementUnitsPerSecond: 6 }) });
  await advance(999);
  expect(hook.request).not.toHaveBeenCalled();
  await advance(1);
  expect(hook.request).toHaveBeenCalledTimes(1);
});

it("requests opponent proof while far away, stops when covered and restarts for another finisher", async () => {
  const hook = setup({ runtimeState: runtime({ opponents: [raceOpponent({ status: "FINISHED" })] }) });
  await advance();
  expect(hook.request).toHaveBeenCalledTimes(1);
  hook.update({ finishOrder: proof([2, 9000]) });
  await advance(1000);
  expect(hook.request).toHaveBeenCalledTimes(1);
  hook.update({ runtimeState: runtime({ opponents: [raceOpponent({ status: "FINISHED" }),
    raceOpponent({ racePlayerId: 3, status: "FINISHED" })] }) });
  await advance();
  expect(hook.request).toHaveBeenCalledTimes(2);
});

it("retries sequentially after completion, pauses offline and resumes without releasing unproved finishers", async () => {
  let resolve;
  const request = vi.fn().mockImplementationOnce(() => new Promise((done) => { resolve = done; }))
    .mockResolvedValue(null);
  const hook = setup({ runtimeState: runtime({ position: 990 }), requestFinishArbitration: request });
  await advance(1000);
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => { resolve(null); });
  await advance(349);
  expect(request).toHaveBeenCalledTimes(1);
  await advance(1);
  expect(request).toHaveBeenCalledTimes(2);
  hook.update({ finishSyncEnabled: false });
  await advance(2000);
  expect(request).toHaveBeenCalledTimes(2);
  expect(hook.result.current.presentation.releasedFinisherIds).toEqual([]);
  hook.update({ finishSyncEnabled: true });
  await advance();
  expect(request).toHaveBeenCalledTimes(3);
});

it("extends release order without overtaking pending cohorts and releases same-ms ties together", async () => {
  const hook = setup({ finishOrder: proof([2, 9000], [3, 9100]) });
  await advance();
  expect(hook.result.current.presentation.releasedFinisherIds).toEqual([2]);
  hook.update({ finishOrder: proof([2, 9000], [3, 9100], [1, 9200], [4, 9200]) });
  await advance(120);
  expect(hook.result.current.presentation.releasedFinisherIds).toEqual([2, 3]);
  await advance(120);
  expect(hook.result.current.presentation.releasedFinisherIds).toEqual([2, 3, 1, 4]);
  hook.update({ finishOrder: proof([2, 9000], [3, 9100], [1, 9200], [4, 9200]) });
  await advance(100);
  expect(hook.result.current.presentation.releasedFinisherIds).toEqual([2, 3, 1, 4]);
});

it("clears old race release and completion timers and cleans all timers on unmount", async () => {
  const hook = setup({ finishOrder: proof([1, 9000], [2, 9100]) });
  await advance();
  hook.update({ runtimeState: runtime({}, { raceId: 8 }), finishOrder: null });
  await advance(1500);
  expect(hook.result.current.presentation.releasedFinisherIds).toEqual([]);
  expect(hook.result.current.presentationComplete).toBe(false);
  hook.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("preserves released proof through a passive pause", async () => {
  const hook = setup({ finishOrder: proof([2, 9000]) });
  await advance();
  hook.update({ finishSyncEnabled: false });
  await advance(500);
  hook.update({ finishSyncEnabled: true });
  expect(hook.result.current.presentation.releasedFinisherIds).toEqual([2]);
});

it("does not wait forever for a non-finisher when the race ends", async () => {
  const hook = setup();
  hook.update({ runtimeState: runtime({ raceFinished: true, raceStatus: "FINISHED", playerStatus: "DISCONNECTED" }),
    view: RACE_VIEWS.FINISHED });
  await advance(2000);
  expect(hook.result.current.keepRaceScreen).toBe(false);
  expect(hook.result.current.presentation.ownCrossingReleased).toBe(false);
  expect(hook.request).not.toHaveBeenCalled();
});
