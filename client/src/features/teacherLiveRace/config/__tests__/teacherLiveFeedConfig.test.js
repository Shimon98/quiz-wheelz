import { expect, it } from "vitest";

import he from "../../../../i18n/locales/he/teacherLiveRace";
import en from "../../../../i18n/locales/en/teacherLiveRace";
import {
  TEACHER_FEED_KINDS,
  TEACHER_FEED_MESSAGE_KEYS,
  TEACHER_FEED_PRESENTATION,
  TEACHER_FEED_PRIORITY_OF_KIND,
} from "../teacherLiveFeedConfig";

const messageAt = (locale, key) => key.split(".").reduce((node, part) => node?.[part], locale);

it("gives every feed kind a Hebrew and an English line, an icon and a priority", () => {
  for (const kind of Object.values(TEACHER_FEED_KINDS)) {
    const key = TEACHER_FEED_MESSAGE_KEYS[kind];

    expect(messageAt(he, key), `${kind} in Hebrew`).toBeTypeOf("string");
    expect(messageAt(en, key), `${kind} in English`).toBeTypeOf("string");
    expect(TEACHER_FEED_PRESENTATION[kind]?.icon, `${kind} icon`).toBeTruthy();
    expect(TEACHER_FEED_PRIORITY_OF_KIND[kind], `${kind} priority`).toBeTypeOf("number");
  }
});
