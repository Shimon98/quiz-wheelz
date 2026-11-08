import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCAL_DEV_API_BASE_URL } from "../../constants/apiEndpointConstants.js";

// A fresh clone has no client/.env (it is not in git). The API base must still reach the local server in a dev run,
// for plain requests and for both live streams, which build their URLs from the same client.
async function freshApi() {
  vi.resetModules();
  const httpClient = (await import("../httpClient.js")).default;
  const { createStudentRaceEventSource } = await import("../studentRaceLiveApi.js");
  const { createTeacherRaceEventSource } = await import("../teacherRaceLiveApi.js");
  return { httpClient, createStudentRaceEventSource, createTeacherRaceEventSource };
}

describe("httpClient API base", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses VITE_API_BASE_URL when client/.env sets it", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8081/api");

    expect((await freshApi()).httpClient.defaults.baseURL).toBe("http://localhost:8081/api");
  });

  it("talks to the local server in a fresh clone's dev run, for requests and both live streams", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubEnv("DEV", true);
    const EventSourceMock = vi.fn(function (url) { this.url = url; });
    vi.stubGlobal("EventSource", EventSourceMock);

    const api = await freshApi();
    api.createStudentRaceEventSource(3);
    api.createTeacherRaceEventSource(7, 4);

    expect(api.httpClient.defaults.baseURL).toBe(LOCAL_DEV_API_BASE_URL);
    expect(EventSourceMock.mock.calls.map(([url]) => url)).toEqual([
      `${LOCAL_DEV_API_BASE_URL}/race-players/me/events/stream?afterVersion=3`,
      `${LOCAL_DEV_API_BASE_URL}/teacher/races/7/events/stream?afterVersion=4`,
    ]);
  });

  it("never guesses an address in a production build", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubEnv("DEV", false);

    expect((await freshApi()).httpClient.defaults.baseURL).toBeUndefined();
  });
});
