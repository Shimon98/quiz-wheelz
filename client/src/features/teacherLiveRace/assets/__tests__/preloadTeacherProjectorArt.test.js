import { afterEach, describe, expect, it, vi } from "vitest";

import { TEACHER_RACE_PROJECTOR_ART } from "../teacherRaceProjectorArt";
import { RACE_VEHICLE_SIDE_ART } from "../../../../shared/raceVehicles/raceVehicleSideArt";
import { TEACHER_FEED_PRESENTATION } from "../../config/teacherLiveFeedConfig";

async function loadPreloader() {
  vi.resetModules();
  return import("../preloadTeacherProjectorArt");
}

function recordingImage(sources) {
  return class {
    set src(value) {
      sources.push(value);
    }
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("preloadTeacherProjectorArt", () => {
  // The live feed's moment paintings come too, so a row never waits for its icon (the trophy is already an accent).
  it("collects every projector, vehicle and live-feed URL from the existing art owners, once each", async () => {
    const { collectTeacherProjectorArtUrls } = await loadPreloader();
    const { backdrop, verge, signs, uiAccents } = TEACHER_RACE_PROJECTOR_ART;
    const expected = new Set([
      backdrop,
      verge,
      ...Object.values(signs),
      ...Object.values(uiAccents),
      ...Object.values(RACE_VEHICLE_SIDE_ART),
      ...Object.values(TEACHER_FEED_PRESENTATION).map(({ art }) => art),
    ]);

    const urls = collectTeacherProjectorArtUrls();

    expect(new Set(urls)).toEqual(expected);
    expect(urls).toHaveLength(expected.size);
    expect(urls).toHaveLength(28);
  });

  it("requests each image once per session even when the waiting room asks again", async () => {
    const { preloadTeacherProjectorArt, collectTeacherProjectorArtUrls } = await loadPreloader();
    const sources = [];
    vi.stubGlobal("Image", recordingImage(sources));

    preloadTeacherProjectorArt();
    preloadTeacherProjectorArt();

    expect(sources).toEqual(collectTeacherProjectorArtUrls());
  });

  it("never throws when the browser refuses to create images and retries on the next call", async () => {
    const { preloadTeacherProjectorArt, collectTeacherProjectorArtUrls } = await loadPreloader();
    vi.stubGlobal("Image", class {
      constructor() {
        throw new Error("image creation blocked");
      }
    });

    expect(() => preloadTeacherProjectorArt()).not.toThrow();

    const sources = [];
    vi.stubGlobal("Image", recordingImage(sources));
    preloadTeacherProjectorArt();

    expect(sources).toHaveLength(collectTeacherProjectorArtUrls().length);
  });

  it("forgets a request that failed so a later waiting-room visit can retry it", async () => {
    const { preloadTeacherProjectorArt, collectTeacherProjectorArtUrls } = await loadPreloader();
    const images = [];
    vi.stubGlobal("Image", class {
      constructor() {
        images.push(this);
      }
    });

    preloadTeacherProjectorArt();
    images[0].onerror();
    images.length = 0;
    preloadTeacherProjectorArt();

    expect(images).toHaveLength(1);
    expect(images[0].src).toBe(collectTeacherProjectorArtUrls()[0]);
  });
});
