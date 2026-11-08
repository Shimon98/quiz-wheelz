import { expect, it } from "vitest";

import he from "../locales/he/studentRace";
import en from "../locales/en/studentRace";

function entries(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === "object" ? entries(child, `${prefix}${key}.`) : [[`${prefix}${key}`, child]],
  );
}

const placeholders = (text) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map(([, name]) => name).sort();

it("gives the Hebrew and English race screens exactly the same keys", () => {
  expect(entries(en).map(([key]) => key).sort()).toEqual(entries(he).map(([key]) => key).sort());
});

it("keeps every line's values the same in Hebrew and English", () => {
  const english = Object.fromEntries(entries(en));

  for (const [key, text] of entries(he)) {
    expect(placeholders(text), key).toEqual(placeholders(english[key]));
  }
});

// The notice line already paints the gold medal beside these words (C5-05e), so the words carry no second trophy.
it("tells first place in words only, beside the painted gold medal", () => {
  expect(he.gameplay.rank.lead).not.toMatch(/🏆/u);
  expect(en.gameplay.rank.lead).not.toMatch(/🏆/u);
});
