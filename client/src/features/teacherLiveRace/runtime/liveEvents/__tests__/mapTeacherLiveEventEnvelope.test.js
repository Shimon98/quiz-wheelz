import { describe, expect, it } from "vitest";

import { mapTeacherLiveEventEnvelope } from "../mapTeacherLiveEventEnvelope";
import { teacherLiveEvent } from "../../teacherRaceLiveTestFixtures";
import { ApiContractError } from "../../../../../errors/ApiContractError";

describe("mapTeacherLiveEventEnvelope", () => {
  it("maps a valid envelope and preserves the raw payload untouched", () => {
    const raw = teacherLiveEvent({ payload: { anything: [1, 2] } });

    expect(mapTeacherLiveEventEnvelope(raw)).toEqual({
      raceId: 7,
      version: 13,
      type: "PLAYER_PROGRESS_UPDATED",
      occurredAtEpochMs: 1_755_600_001_000,
      rawPayload: raw.payload,
    });
  });

  it("accepts an unknown future type without inspecting its payload", () => {
    const mapped = mapTeacherLiveEventEnvelope(
      teacherLiveEvent({ type: "POWER_UP_ACTIVATED", payload: null }),
    );

    expect(mapped.type).toBe("POWER_UP_ACTIVATED");
    expect(mapped.rawPayload).toBeNull();
  });

  it.each([
    ["zero raceId", { raceId: 0 }],
    ["string version", { version: "13" }],
    ["zero version", { version: 0 }],
    ["missing occurredAtEpochMs", { occurredAtEpochMs: undefined }],
    ["blank type", { type: " " }],
  ])("rejects %s", (_label, overrides) => {
    expect(() =>
      mapTeacherLiveEventEnvelope(teacherLiveEvent(overrides)),
    ).toThrow(ApiContractError);
  });

  it("rejects a non-object envelope", () => {
    expect(() => mapTeacherLiveEventEnvelope("event")).toThrow(ApiContractError);
  });
});
