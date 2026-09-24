import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";
import { TEACHER_CONNECTION_PRESENTATION } from "../../config/teacherRaceLiveConfig";
import { TEACHER_RACE_PROJECTOR_ART } from "../teacherRaceProjectorArt";

const ASSET_DIRECTORY = path.resolve(
  import.meta.dirname,
  "../../../../assets/game/teacherRace/projector",
);
const EXTENDED_CHUNK = "VP8X";
const SIMPLE_LOSSY_CHUNK = "VP8 ";
const ALPHA_FLAG = 0x10;
const VP8_DIMENSION_MASK = 0x3fff;

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

function readWebpHeader(fileName) {
  const bytes = readFileSync(path.join(ASSET_DIRECTORY, fileName));
  const riff = bytes.toString("latin1", 0, 4) + bytes.toString("latin1", 8, 12);
  const chunk = bytes.toString("latin1", 12, 16);

  if (chunk === EXTENDED_CHUNK) {
    return {
      riff,
      chunk,
      hasAlpha: (bytes[20] & ALPHA_FLAG) !== 0,
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    };
  }

  return {
    riff,
    chunk,
    hasAlpha: false,
    width: bytes.readUInt16LE(26) & VP8_DIMENSION_MASK,
    height: bytes.readUInt16LE(28) & VP8_DIMENSION_MASK,
  };
}

describe("teacher projector world art files", () => {
  it.each(Object.entries(EXPECTED_FILES))("ships %s at its production size", (fileName, expected) => {
    expect(readWebpHeader(fileName)).toEqual({ riff: "RIFFWEBP", ...expected });
  });

  it("keeps the sign board configuration in sync with the shipped props", () => {
    const start = readWebpHeader("teacher-start-sign.webp");
    const finish = readWebpHeader("teacher-finish-sign.webp");
    const { signBoards } = TEACHER_RACE_PROJECTOR_CONFIG;

    expect(signBoards.start.aspectRatio).toBeCloseTo(start.width / start.height, 6);
    expect(signBoards.finish.aspectRatio).toBeCloseTo(finish.width / finish.height, 6);
    for (const board of Object.values(signBoards)) {
      expect(board.textBox.left + board.textBox.width).toBeLessThanOrEqual(100);
      expect(board.textBox.top + board.textBox.height).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the title plaque slices inside the shipped image and its caps wider than the text padding", () => {
    const badge = readWebpHeader("teacher-title-badge.webp");
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
