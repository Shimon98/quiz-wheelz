import { expect, it } from "vitest";

import { MAX_PLAYERS_OPTIONS } from "../createRaceConfig";
import { RACE_MAX_PLAYERS } from "../../../../constants/raceRulesConstants";

it("offers every player count from two up to the shared race maximum", () => {
  expect(MAX_PLAYERS_OPTIONS).toEqual([2, 3, 4, 5, 6, 7, 8]);
  expect(MAX_PLAYERS_OPTIONS.at(-1)).toBe(RACE_MAX_PLAYERS);
});
