import path from "node:path";
import { describe, expect, it } from "vitest";

import { ROUTES } from "../../../../constants/routeConstants";
import { STUDENT_ENTRY_SHELL_CONFIG } from "../../../../features/studentJoin/layout/studentShellConfig";
import { readWebpHeader, WEBP_CHUNKS, WEBP_RIFF_SIGNATURE } from "../../../../test/readWebpHeader";

// The entry illustration set: the public and student entry shell heroes and the teacher dashboard
// greeting. Built from private masters by docs/vision/entry-hero-source/process_entry_heroes.py.
const ASSET_ROOT = path.resolve(import.meta.dirname, "../../../../assets");

const EXPECTED_FILES = Object.freeze({
  "landing/landing-hero-jungle-monkey-kart.webp": { chunk: WEBP_CHUNKS.SIMPLE_LOSSY, hasAlpha: false, width: 1672, height: 941 },
  "student/student-join-hero-wide.webp": { chunk: WEBP_CHUNKS.SIMPLE_LOSSY, hasAlpha: false, width: 1448, height: 1086 },
  "student/student-waiting-hero-wide.webp": { chunk: WEBP_CHUNKS.SIMPLE_LOSSY, hasAlpha: false, width: 988, height: 741 },
  "workspace/greeting-hero-desktop.webp": { chunk: WEBP_CHUNKS.EXTENDED, hasAlpha: true, width: 600, height: 450 },
  "workspace/greeting-hero-mobile.webp": { chunk: WEBP_CHUNKS.EXTENDED, hasAlpha: true, width: 400, height: 300 },
});

describe("entry illustration art files", () => {
  it.each(Object.entries(EXPECTED_FILES))("ships %s at its production size", (file, expected) => {
    expect(readWebpHeader(path.join(ASSET_ROOT, file))).toEqual({ riff: WEBP_RIFF_SIGNATURE, ...expected });
  });

  it("keeps the join and waiting heroes in one frame, so the monkey stays in place between the screens", () => {
    const join = readWebpHeader(path.join(ASSET_ROOT, "student/student-join-hero-wide.webp"));
    const waiting = readWebpHeader(path.join(ASSET_ROOT, "student/student-waiting-hero-wide.webp"));
    const { defaultHero, heroes } = STUDENT_ENTRY_SHELL_CONFIG;

    expect(waiting.width / waiting.height).toBeCloseTo(join.width / join.height, 2);
    expect(heroes[ROUTES.STUDENT_WAITING].objectPosition).toBe(defaultHero.objectPosition);
  });
});
