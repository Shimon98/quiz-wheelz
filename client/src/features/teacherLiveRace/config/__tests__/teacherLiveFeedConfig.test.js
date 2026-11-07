import { expect, it } from "vitest";

import he from "../../../../i18n/locales/he/teacherLiveRace";
import en from "../../../../i18n/locales/en/teacherLiveRace";
import { RACE_MOMENT_ART } from "../../../../shared/raceMoments/raceMomentArt";
import { RACE_RESULTS_ART } from "../../../../shared/raceResults/raceResultsArt";
import { RACE_CHALLENGE_ART } from "../../../studentRace/config/raceChallengeArt";
import { TEACHER_RACE_PROJECTOR_ART } from "../../assets/teacherRaceProjectorArt";
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

// Astra V5: eight new paintings, and five the game already shows for the same moment elsewhere.
it.each([
  [TEACHER_FEED_KINDS.CORRECT_ANSWER, RACE_MOMENT_ART.correctAnswer],
  [TEACHER_FEED_KINDS.RANK_UP, RACE_MOMENT_ART.rankUp],
  [TEACHER_FEED_KINDS.TOOK_LEAD, RACE_RESULTS_ART.placement.gold],
  [TEACHER_FEED_KINDS.STREAK, RACE_RESULTS_ART.stats.streak],
  [TEACHER_FEED_KINDS.TURBO_SUCCESS, RACE_CHALLENGE_ART.turboEmblem],
  [TEACHER_FEED_KINDS.SAFE_PERFECT, RACE_CHALLENGE_ART.safeEmblem],
  [TEACHER_FEED_KINDS.SHIELD_EARNED, RACE_MOMENT_ART.shieldEarned],
  [TEACHER_FEED_KINDS.LUCK_TAILWIND, RACE_MOMENT_ART.luckTailwind],
  [TEACHER_FEED_KINDS.LUCK_ENERGY_ORB, RACE_MOMENT_ART.luckEnergyOrb],
  [TEACHER_FEED_KINDS.LUCK_MUD, RACE_MOMENT_ART.luckMud],
  [TEACHER_FEED_KINDS.LUCK_SHIELD_BLOCKED, RACE_MOMENT_ART.luckShieldBlocked],
  [TEACHER_FEED_KINDS.PLAYER_FINISHED, RACE_MOMENT_ART.playerFinished],
  [TEACHER_FEED_KINDS.RACE_FINISHED, TEACHER_RACE_PROJECTOR_ART.uiAccents.leaderboardTrophy],
])("paints the %s row with its own art", (kind, art) => {
  expect(art).toBeTruthy();
  expect(TEACHER_FEED_PRESENTATION[kind].art).toBe(art);
});

it("paints every feed kind", () => {
  expect(Object.values(TEACHER_FEED_KINDS).filter((kind) => !TEACHER_FEED_PRESENTATION[kind]?.art)).toEqual([]);
});
