import { afterEach, expect, it, vi } from "vitest";
import httpClient from "./httpClient.js";
import { createStudentRaceEventSource, requestFinishArbitration } from "./studentRaceLiveApi.js";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("uses the shared API base and sends only a cursor with credentials", () => {
  const EventSourceMock = vi.fn(function (url, options) { this.url = url; this.options = options; });
  vi.stubGlobal("EventSource", EventSourceMock);
  const baseURL = httpClient.defaults.baseURL;
  try {
    httpClient.defaults.baseURL = "http://localhost:8080/api";
    createStudentRaceEventSource(12);
    expect(EventSourceMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/race-players/me/events/stream?afterVersion=12", { withCredentials: true },
    );
  } finally {
    httpClient.defaults.baseURL = baseURL;
  }
});

it("posts arbitration without a body or client identity and unwraps the existing envelope", async () => {
  const data = { raceId: 7 };
  const post = vi.spyOn(httpClient, "post").mockResolvedValue({ success: true, data });
  expect(await requestFinishArbitration()).toBe(data);
  expect(post).toHaveBeenCalledExactlyOnceWith(API_ENDPOINTS.RACE_PLAYERS.FINISH_ARBITRATION);
});
