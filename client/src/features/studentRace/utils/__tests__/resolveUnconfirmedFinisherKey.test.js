import { describe, expect, it } from "vitest";

import {
  resultsFinishOrder,
  resultsOpponent,
  resultsRuntime,
} from "../../runtime/studentRaceResultsTestFixtures";
import { resolveUnconfirmedFinisherKey } from "../resolveUnconfirmedFinisherKey";

const RACING_FIELD = [
  resultsOpponent(2, "RACING", 2),
  resultsOpponent(3, "RACING", 3),
  resultsOpponent(4, "DISCONNECTED", 4),
];

describe("resolveUnconfirmedFinisherKey", () => {
  it("is empty when nobody finished", () => {
    const runtime = resultsRuntime({
      playerStatus: "RACING",
      playerFinished: false,
      playerFinishedAtEpochMs: null,
      position: 500,
      opponents: RACING_FIELD,
    });

    expect(resolveUnconfirmedFinisherKey(runtime, null)).toBe("");
  });

  it("names a single finisher that is not proven yet", () => {
    expect(resolveUnconfirmedFinisherKey(resultsRuntime({ opponents: RACING_FIELD }), null)).toBe("1");
  });

  it("builds the same key for the same pending set whatever the server list order is", () => {
    const first = resultsRuntime({
      opponents: [resultsOpponent(12, "FINISHED", 2), resultsOpponent(7, "FINISHED", 3)],
      playerCount: 3,
    });
    const reordered = resultsRuntime({
      opponents: [resultsOpponent(7, "FINISHED", 2), resultsOpponent(12, "FINISHED", 3)],
      playerCount: 3,
    });

    expect(resolveUnconfirmedFinisherKey(first, null)).toBe("1,7,12");
    expect(resolveUnconfirmedFinisherKey(reordered, null)).toBe("1,7,12");
  });

  it("leaves out every finisher the proof already confirms", () => {
    expect(resolveUnconfirmedFinisherKey(resultsRuntime(), resultsFinishOrder([1, 1], [2, 2]))).toBe("3");
  });

  it("changes when a new finisher appears and empties once everyone is proven", () => {
    const proof = resultsFinishOrder([1, 1], [2, 2]);
    const withNewFinisher = resultsRuntime({
      opponents: [
        resultsOpponent(2, "FINISHED", 2),
        resultsOpponent(3, "FINISHED", 3),
        resultsOpponent(4, "FINISHED", 4),
        resultsOpponent(5, "DISCONNECTED", 5),
      ],
    });

    expect(resolveUnconfirmedFinisherKey(withNewFinisher, proof)).toBe("3,4");
    expect(
      resolveUnconfirmedFinisherKey(withNewFinisher, resultsFinishOrder([1, 1], [2, 2], [3, 3], [4, 4])),
    ).toBe("");
  });

  it("never touches the runtime order it reads", () => {
    const runtime = resultsRuntime({
      opponents: [resultsOpponent(12, "FINISHED", 2), resultsOpponent(7, "FINISHED", 3)],
      playerCount: 3,
    });

    resolveUnconfirmedFinisherKey(runtime, null);

    expect(runtime.opponents.map((opponent) => opponent.racePlayerId)).toEqual([12, 7]);
  });
});
