import { afterEach, expect, it, vi } from "vitest";

import httpClient from "../httpClient.js";
import { getTeacherRaceResults } from "../teacherRaceResultsApi";
import { ApiContractError } from "../../errors/ApiContractError";

afterEach(() => {
  vi.restoreAllMocks();
});

it("reads the owned race results through the shared client and unwraps the envelope", async () => {
  const data = { raceId: 7, players: [] };
  const get = vi.spyOn(httpClient, "get").mockResolvedValue({ success: true, data });

  expect(await getTeacherRaceResults(7)).toBe(data);
  expect(get).toHaveBeenCalledExactlyOnceWith("/teacher/races/7/results");
});

it("fails fast when the success envelope is broken", async () => {
  vi.spyOn(httpClient, "get").mockResolvedValue({ raceId: 7 });

  await expect(getTeacherRaceResults(7)).rejects.toBeInstanceOf(ApiContractError);
});
