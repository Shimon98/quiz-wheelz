import { describe, expect, it, vi } from "vitest";

import { chooseOfferedChallenge } from "../devRaceBotChallenge.mjs";

function choosingBot(offerId = 9, overrides = {}) {
  return {
    index: 1, cookie: "RACE_PLAYER_TOKEN=test", challenges: 0, attemptedOfferId: null, attemptedChoice: null,
    gameplay: { mode: "CHALLENGE_CHOICE", challenge: { offer: { offerId, choices: ["TURBO_TRIAL", "SAFE_RUN"] } } },
    ...overrides,
  };
}

describe("dev race bot challenge choice", () => {
  it("never replays a failed choice on the same offer and counts only confirmed choices", async () => {
    const call = vi.fn().mockRejectedValue(new Error("POST /race-players/me/challenge/choice -> 500 null"));
    const bot = choosingBot();

    await expect(chooseOfferedChallenge(bot, { policy: "turbo", call }))
      .rejects.toThrow(/TURBO_TRIAL on offer 9 not confirmed, no automatic retry/);
    await expect(chooseOfferedChallenge(bot, { policy: "turbo", call })).resolves.toMatch(/waits for race state/);

    expect(call).toHaveBeenCalledTimes(1);
    expect(bot.challenges).toBe(0);
  });

  it("keeps a terminal server error readable for the caller that stops the bot", async () => {
    const call = vi.fn().mockRejectedValue(new Error("POST -> 409 RACE_NOT_IN_PROGRESS"));

    await expect(chooseOfferedChallenge(choosingBot(), { policy: "safe", call })).rejects.toThrow(/RACE_NOT_IN_PROGRESS/);
  });

  it("chooses again for a new offer and records the confirmed run", async () => {
    const runGameplay = { mode: "TURBO_TRIAL" };
    const call = vi.fn().mockRejectedValueOnce(new Error("lost"))
      .mockResolvedValueOnce({ data: { snapshot: { gameplay: runGameplay } } });
    const bot = choosingBot();
    await chooseOfferedChallenge(bot, { policy: "turbo", call }).catch(() => {});
    bot.gameplay = choosingBot(10).gameplay;

    await expect(chooseOfferedChallenge(bot, { policy: "turbo", call })).resolves.toBe("chose TURBO_TRIAL");

    expect(call).toHaveBeenLastCalledWith("/race-players/me/challenge/choice",
      { method: "POST", cookie: bot.cookie, body: { offerId: 10, choice: "TURBO_TRIAL" } });
    expect(bot.challenges).toBe(1);
    expect(bot.gameplay).toBe(runGameplay);
  });

  it("alternates Turbo and Safe per confirmed choice under the random policy", async () => {
    const call = vi.fn().mockResolvedValue({ data: null });
    const bot = choosingBot(9, { index: 0 });

    await expect(chooseOfferedChallenge(bot, { policy: "random", call })).resolves.toBe("chose TURBO_TRIAL");
    bot.gameplay = choosingBot(10).gameplay;
    await expect(chooseOfferedChallenge(bot, { policy: "random", call })).resolves.toBe("chose SAFE_RUN");
  });

  it("lets the offer expire under the none policy without a request", async () => {
    const call = vi.fn();

    await expect(chooseOfferedChallenge(choosingBot(), { policy: "none", call })).resolves.toMatch(/expire/);
    expect(call).not.toHaveBeenCalled();
  });
});
