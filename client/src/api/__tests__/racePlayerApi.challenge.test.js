import { afterEach, expect, it, vi } from "vitest";

import httpClient from "../httpClient.js";
import { chooseChallenge } from "../racePlayerApi.js";
import { API_ENDPOINTS } from "../../constants/apiEndpointConstants.js";

afterEach(() => {
  vi.restoreAllMocks();
});

it("posts only the offer and the choice to the challenge endpoint and unwraps the envelope", async () => {
  const data = { offerId: 17, choice: "SAFE_RUN" };
  const post = vi.spyOn(httpClient, "post").mockResolvedValue({ success: true, data });

  expect(await chooseChallenge({ offerId: 17, choice: "SAFE_RUN" }, { timeoutMs: 4000 })).toBe(data);
  expect(post).toHaveBeenCalledExactlyOnceWith(
    API_ENDPOINTS.RACE_PLAYERS.CHALLENGE_CHOICE,
    { offerId: 17, choice: "SAFE_RUN" },
    { timeout: 4000 },
  );
  expect(API_ENDPOINTS.RACE_PLAYERS.CHALLENGE_CHOICE).toBe("/race-players/me/challenge/choice");
});
