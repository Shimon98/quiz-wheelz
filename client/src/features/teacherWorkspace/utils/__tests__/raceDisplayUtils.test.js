import { expect, it } from "vitest";

import { buildRaceViewModel } from "../raceDisplayUtils";
import { SUPPORTED_LANGUAGES } from "../../../../i18n/i18nConstants";

it("keys the view model by the server raceId and falls back to a legacy id", () => {
  const serverRace = { raceId: 7, title: "Jungle Cup", status: "IN_PROGRESS" };
  const legacyRace = { id: 9, title: "Old Cup", status: "FINISHED" };

  expect(buildRaceViewModel(serverRace, SUPPORTED_LANGUAGES.HEBREW).id).toBe(7);
  expect(buildRaceViewModel(legacyRace, SUPPORTED_LANGUAGES.HEBREW).id).toBe(9);
});
