import path from "node:path";
import { describe, expect, it } from "vitest";

import { readWebpHeader, WEBP_CHUNKS, WEBP_RIFF_SIGNATURE } from "../../../../test/readWebpHeader";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";
import { TEACHER_CONNECTION_PRESENTATION } from "../../config/teacherRaceLiveConfig";
import { TEACHER_RACE_PROJECTOR_ART } from "../teacherRaceProjectorArt";

const ASSET_DIRECTORY = path.resolve(
  import.meta.dirname,
  "../../../../assets/game/teacherRace/projector",
);
const EXTENDED_CHUNK = WEBP_CHUNKS.EXTENDED;
const SIMPLE_LOSSY_CHUNK = WEBP_CHUNKS.SIMPLE_LOSSY;

const EXPECTED_FILES = Object.freeze({
  "teacher-jungle-backdrop.webp": { chunk: SIMPLE_LOSSY_CHUNK, hasAlpha: false, width: 1672, height: 941 },
  "teacher-start-sign.webp": { chunk: EXTENDED_CHUNK, hasAlpha: true, width: 640, height: 616 },
  "teacher-finish-sign.webp": { chunk: EXTENDED_CHUNK, hasAlpha: true, width: 640, height: 626 },
  "teacher-jungle-verge.webp": { chunk: EXTENDED_CHUNK, hasAlpha: true, width: 1536, height: 359 },
  "teacher-leaderboard-trophy.webp": { chunk: EXTENDED_CHUNK, hasAlpha: true, width: 256, height: 248 },
  "teacher-live-events-bolt.webp": { chunk: EXTENDED_CHUNK, hasAlpha: true, width: 207, height: 256 },
  "teacher-connection-wifi.webp": { chunk: EXTENDED_CHUNK, hasAlpha: true, width: 256, height: 213 },
  "teacher-title-badge.webp": { chunk: EXTENDED_CHUNK, hasAlpha: true, width: 1024, height: 329 },
});

function readProjectorArtHeader(fileName) {
  return readWebpHeader(path.join(ASSET_DIRECTORY, fileName));
}

describe("teacher projector world art files", () => {
  it.each(Object.entries(EXPECTED_FILES))("ships %s at its production size", (fileName, expected) => {
    expect(readProjectorArtHeader(fileName)).toEqual({ riff: WEBP_RIFF_SIGNATURE, ...expected });
  });

  it("keeps the sign board configuration in sync with the shipped props", () => {
    const start = readProjectorArtHeader("teacher-start-sign.webp");
    const finish = readProjectorArtHeader("teacher-finish-sign.webp");
    const { signBoards } = TEACHER_RACE_PROJECTOR_CONFIG;

    expect(signBoards.start.aspectRatio).toBeCloseTo(start.width / start.height, 6);
    expect(signBoards.finish.aspectRatio).toBeCloseTo(finish.width / finish.height, 6);
    for (const board of Object.values(signBoards)) {
      expect(board.textBox.left + board.textBox.width).toBeLessThanOrEqual(100);
      expect(board.textBox.top + board.textBox.height).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the title plaque slices inside the shipped image and its caps wider than the text padding", () => {
    const badge = readProjectorArtHeader("teacher-title-badge.webp");
    const { titleBadge } = TEACHER_RACE_PROJECTOR_CONFIG;

    expect(titleBadge.aspectRatio).toBeCloseTo(badge.width / badge.height, 6);
    expect(titleBadge.sliceLeftPx + titleBadge.sliceRightPx).toBeLessThan(badge.width);
    expect(titleBadge.capLeft).toBeCloseTo(titleBadge.sliceLeftPx / badge.height, 3);
    expect(titleBadge.capRight).toBeCloseTo(titleBadge.sliceRightPx / badge.height, 3);
    expect(titleBadge.textPadLeft).toBeLessThan(titleBadge.capLeft);
    expect(titleBadge.textPadRight).toBeLessThan(titleBadge.capRight);
  });

  it("resolves every connection art key and every UI accent to a shipped file", () => {
    const artKeys = Object.values(TEACHER_CONNECTION_PRESENTATION)
      .map((presentation) => presentation.artKey)
      .filter(Boolean);

    expect(artKeys.length).toBeGreaterThan(0);
    for (const key of artKeys) {
      expect(TEACHER_RACE_PROJECTOR_ART.uiAccents[key]).toEqual(expect.any(String));
    }
    expect(Object.keys(TEACHER_RACE_PROJECTOR_ART.uiAccents).sort()).toEqual(
      ["connectionWifi", "leaderboardTrophy", "liveEventsBolt", "titleBadge"],
    );
  });
});
