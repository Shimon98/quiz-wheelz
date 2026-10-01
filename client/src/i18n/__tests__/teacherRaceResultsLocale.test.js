import { expect, it } from "vitest";

import he from "../locales/he/teacherRaceResults";
import en from "../locales/en/teacherRaceResults";

function keyPaths(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === "object" ? keyPaths(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

it("gives the Hebrew and English results screens exactly the same keys", () => {
  expect(keyPaths(en).sort()).toEqual(keyPaths(he).sort());
});
