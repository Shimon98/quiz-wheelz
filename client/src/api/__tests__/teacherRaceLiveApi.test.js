import { afterEach, expect, it, vi } from "vitest";

import httpClient from "../httpClient.js";
import { createTeacherRaceEventSource, getTeacherRaceLiveState } from "../teacherRaceLiveApi";
import { ApiContractError } from "../../errors/ApiContractError";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("opens the teacher stream on the shared API base with only a cursor and credentials", () => {
  const EventSourceMock = vi.fn(function (url, options) { this.url = url; this.options = options; });
  vi.stubGlobal("EventSource", EventSourceMock);
  const baseURL = httpClient.defaults.baseURL;
  try {
    httpClient.defaults.baseURL = "http://localhost:8080/api";
    createTeacherRaceEventSource(7, 12);
    expect(EventSourceMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/teacher/races/7/events/stream?afterVersion=12", { withCredentials: true },
    );
  } finally {
    httpClient.defaults.baseURL = baseURL;
  }
});

it("reads the owned race live state through the shared client and unwraps the envelope", async () => {
  const data = { raceId: 7, players: [] };
  const get = vi.spyOn(httpClient, "get").mockResolvedValue({ success: true, data });

  expect(await getTeacherRaceLiveState(7)).toBe(data);
  expect(get).toHaveBeenCalledExactlyOnceWith("/teacher/races/7/live-state");
});

it("fails fast when the success envelope is broken", async () => {
  vi.spyOn(httpClient, "get").mockResolvedValue({ raceId: 7 });

  await expect(getTeacherRaceLiveState(7)).rejects.toBeInstanceOf(ApiContractError);
});
