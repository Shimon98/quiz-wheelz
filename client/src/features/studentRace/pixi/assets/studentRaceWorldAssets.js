import { Assets } from "pixi.js";

import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";

export const WORLD_ASSET_STATUS = Object.freeze({
  LOADED: "loaded",
  FALLBACK: "fallback",
});

const warnedAssets = new Set();

export async function loadStudentRaceWorldTexture(
  assetUrl,
  {
    loadTexture = (url) => Assets.load(url),
    repeat = false,
    mipmaps = false,
    maxAnisotropy = 1,
  } = {},
) {
  if (typeof assetUrl !== "string" || assetUrl === "") {
    return { status: WORLD_ASSET_STATUS.FALLBACK, assetUrl };
  }

  let timeoutId;
  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Student race world asset load timed out"));
      }, STUDENT_RACE_WORLD_ART.loading.timeoutMs);
    });
    const texture = await Promise.race([loadTexture(assetUrl), timeout]);
    if (repeat) {
      texture.source.style.addressMode = "repeat";
    }
    if (mipmaps) {
      texture.source.autoGenerateMipmaps = true;
    }
    if (maxAnisotropy > 1) {
      texture.source.style.maxAnisotropy = maxAnisotropy;
    }
    return { status: WORLD_ASSET_STATUS.LOADED, assetUrl, texture };
  } catch (error) {
    if (!warnedAssets.has(assetUrl)) {
      warnedAssets.add(assetUrl);
      console.warn(`Student race world asset unavailable: ${assetUrl}`);
    }
    return { status: WORLD_ASSET_STATUS.FALLBACK, assetUrl, error };
  } finally {
    clearTimeout(timeoutId);
  }
}
